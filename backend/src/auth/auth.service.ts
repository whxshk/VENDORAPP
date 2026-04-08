import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument } from '../database/schemas/User.schema';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { Customer, CustomerDocument } from '../database/schemas/Customer.schema';
import { JwtPayload } from './strategies/jwt.strategy';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

const PLATFORM_TENANT_ID = 'sharkband-platform';
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

type OtpPurpose = 'login' | 'signup';

export interface LoginDto {
  email: string;
  password: string;
  tenantId?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface OtpChallengeResponse {
  requiresOtp: true;
  email: string;
  purpose: OtpPurpose;
  expires_in: number;
  message: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  private async ensurePlatformTenant(): Promise<void> {
    try {
      await this.tenantModel.findOneAndUpdate(
        { _id: PLATFORM_TENANT_ID },
        {
          $setOnInsert: { name: 'SharkBand Platform', config: {}, isActive: true, hasCompletedOnboarding: false },
          $unset: { location: '' },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec();
    } catch (err: any) {
      if (err?.code !== 11000) {
        throw new InternalServerErrorException(`Tenant init failed: ${err?.message}`);
      }
    }
  }

  private async ensureUserTenantIsActive(user: UserDocument): Promise<void> {
    if (user.tenantId === PLATFORM_TENANT_ID) {
      return;
    }

    const tenant = await this.tenantModel.findById(user.tenantId).exec();
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Tenant is not active');
    }
  }

  private getOtpHash(userId: string, code: string, purpose: OtpPurpose): string {
    const secret = this.configService.get<string>('app.jwt.secret') || 'dev-secret';
    return crypto
      .createHash('sha256')
      .update(`${userId}:${purpose}:${code}:${secret}`)
      .digest('hex');
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async storeAndSendOtp(user: UserDocument, purpose: OtpPurpose): Promise<OtpChallengeResponse> {
    if (!this.emailService.isConfigured()) {
      throw new BadRequestException(
        'Email delivery is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.',
      );
    }

    const code = this.generateOtp();
    const expiry = new Date(Date.now() + OTP_EXPIRY_MS);
    const otpCodeHash = this.getOtpHash(String(user._id), code, purpose);

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          otpCodeHash,
          otpCodeExpiry: expiry,
          otpCodePurpose: purpose,
          otpCodeAttempts: 0,
        },
      },
    ).exec();

    this.emailService.sendOtpEmail(user.email, user.name || user.email, code, purpose).catch((err) => {
      this.logger.warn?.(`Failed to send ${purpose} OTP email to ${user.email}: ${err?.message}`);
    });

    return {
      requiresOtp: true,
      email: user.email,
      purpose,
      expires_in: Math.floor(OTP_EXPIRY_MS / 1000),
      message: `We sent a 6-digit verification code to ${user.email}.`,
    };
  }

  private issueTokens(user: UserDocument): AuthResponse {
    const payload: JwtPayload = {
      sub: user._id,
      tenantId: user.tenantId,
      email: user.email,
      scopes: user.scopes || [],
      roles: user.roles || [],
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('app.jwt.accessTokenExpiry') || '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user._id, tenantId: user.tenantId },
      {
        secret: this.configService.get<string>('app.jwt.refreshTokenSecret'),
        expiresIn: this.configService.get<string>('app.jwt.refreshTokenExpiry') || '7d',
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
      token_type: 'Bearer',
    };
  }

  private async createCustomerUser(dto: RegisterDto): Promise<UserDocument> {
    await this.ensurePlatformTenant();

    const existing = await this.userModel.findOne({ email: dto.email, tenantId: PLATFORM_TENANT_ID }).exec();
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const customerId = uuidv4();
    const qrTokenSecret = crypto.randomBytes(32).toString('hex');

    try {
      await this.customerModel.create({ _id: customerId, qrTokenSecret, rotationIntervalSec: 300 });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('An account with this email already exists');
      }
      throw new InternalServerErrorException(`Customer create failed: ${err?.message}`);
    }

    try {
      return await this.userModel.create({
        _id: uuidv4(),
        tenantId: PLATFORM_TENANT_ID,
        customerId,
        email: dto.email,
        name: dto.name,
        hashedPassword,
        roles: ['CUSTOMER'],
        scopes: ['customer:*'],
        isActive: true,
      });
    } catch (err: any) {
      await this.customerModel.deleteOne({ _id: customerId }).exec().catch(() => {});
      if (err?.code === 11000) {
        throw new ConflictException('An account with this email already exists');
      }
      throw new InternalServerErrorException(`User create failed: ${err?.message}`);
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password, tenantId } = loginDto;

    const query: any = { email, isActive: true };
    if (tenantId) {
      query.tenantId = tenantId;
    }

    const user = await this.userModel.findOne(query).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.ensureUserTenantIsActive(user);

    return this.issueTokens(user);
  }

  async requestLoginOtp(loginDto: LoginDto): Promise<OtpChallengeResponse> {
    const { email, password, tenantId } = loginDto;

    const query: any = { email, isActive: true };
    if (tenantId) {
      query.tenantId = tenantId;
    }

    const user = await this.userModel.findOne(query).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.ensureUserTenantIsActive(user);

    return this.storeAndSendOtp(user, 'login');
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('app.jwt.refreshTokenSecret'),
      }) as { sub: string; tenantId: string };

      const user = await this.userModel.findById(payload.sub).exec();
      if (!user || !user.isActive || user.tenantId !== payload.tenantId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.issueTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async registerCustomer(dto: { email: string; password: string; name: string }): Promise<AuthResponse> {
    const user = await this.createCustomerUser(dto as RegisterDto);

    this.emailService.sendWelcomeEmail(dto.email, dto.name).catch((err) => {
      this.logger.warn?.(`Failed to send welcome email to ${dto.email}: ${err?.message}`);
    });

    return this.issueTokens(user);
  }

  async requestRegisterOtp(dto: RegisterDto): Promise<OtpChallengeResponse> {
    const user = await this.createCustomerUser(dto);

    try {
      return await this.storeAndSendOtp(user, 'signup');
    } catch (error) {
      await this.userModel.deleteOne({ _id: user._id }).exec().catch(() => {});
      if (user.customerId) {
        await this.customerModel.deleteOne({ _id: user.customerId }).exec().catch(() => {});
      }
      throw error;
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<AuthResponse> {
    const query: any = {
      email: verifyOtpDto.email,
      isActive: true,
    };
    if (verifyOtpDto.tenantId) {
      query.tenantId = verifyOtpDto.tenantId;
    }

    const user = await this.userModel.findOne(query).exec();
    if (!user) {
      throw new BadRequestException('Verification code is invalid or has expired.');
    }

    if (
      !user.otpCodeHash ||
      !user.otpCodeExpiry ||
      !user.otpCodePurpose ||
      user.otpCodePurpose !== verifyOtpDto.purpose ||
      user.otpCodeExpiry.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Verification code is invalid or has expired.');
    }

    if ((user.otpCodeAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many failed attempts. Please request a new verification code.');
    }

    const expectedHash = this.getOtpHash(String(user._id), verifyOtpDto.code, verifyOtpDto.purpose);
    if (expectedHash !== user.otpCodeHash) {
      await this.userModel.updateOne(
        { _id: user._id },
        { $inc: { otpCodeAttempts: 1 } },
      ).exec();
      throw new BadRequestException('Incorrect verification code.');
    }

    await this.ensureUserTenantIsActive(user);

    await this.userModel.updateOne(
      { _id: user._id },
      {
        $unset: {
          otpCodeHash: '',
          otpCodeExpiry: '',
          otpCodePurpose: '',
          otpCodeAttempts: '',
        },
      },
    ).exec();

    if (verifyOtpDto.purpose === 'signup') {
      this.emailService.sendWelcomeEmail(user.email, user.name || user.email).catch((err) => {
        this.logger.warn?.(`Failed to send welcome email to ${user.email}: ${err?.message}`);
      });
    }

    return this.issueTokens(user);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = new RegExp(`^${this.escapeRegex(normalizedEmail)}$`, 'i');
    const user = await this.userModel.findOne({ email: emailPattern, isActive: true }).exec();
    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { passwordResetToken: hashedToken, passwordResetExpiry: expiry } },
    ).exec();

    const isCustomer = user.roles?.includes('CUSTOMER');
    const baseUrl = isCustomer
      ? (process.env.CUSTOMER_APP_URL || 'https://proud-forest-0fba2710f.1.azurestaticapps.net')
      : (process.env.FRONTEND_URL || 'https://purple-ground-02e4fe00f.6.azurestaticapps.net');
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const resetLink = isCustomer
      ? `${normalizedBaseUrl}/?page=ResetPassword&token=${rawToken}`
      : `${normalizedBaseUrl}/reset-password?token=${rawToken}`;

    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.name || user.email, resetLink);
    } catch (err: any) {
      await this.userModel.updateOne(
        { _id: user._id },
        { $unset: { passwordResetToken: '', passwordResetExpiry: '' } },
      ).exec();
      this.logger.error(`Failed to send password reset email to ${user.email}: ${err?.message}`);
      throw new InternalServerErrorException('We could not send the password reset email. Please try again.');
    }

    return { message: `We sent a password reset link to ${user.email}.` };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    if (!token || !newPassword || newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: new Date() },
      isActive: true,
    }).exec();

    if (!user) {
      throw new BadRequestException('Reset token is invalid or has expired.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: { hashedPassword },
        $unset: { passwordResetToken: '', passwordResetExpiry: '' },
      },
    ).exec();

    return { message: 'Password has been reset successfully.' };
  }

  async validateUser(userId: string, tenantId: string) {
    const user = await this.userModel.findOne({
      _id: userId,
      tenantId,
      isActive: true,
    }).exec();

    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      tenantId: user.tenantId,
      email: user.email,
      scopes: user.scopes || [],
      roles: user.roles || [],
    };
  }
}
