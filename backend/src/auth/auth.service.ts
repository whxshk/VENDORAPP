import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { User, UserDocument } from '../database/schemas/User.schema';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { Customer, CustomerDocument } from '../database/schemas/Customer.schema';
import { JwtPayload } from './strategies/jwt.strategy';
import { EmailService } from '../email/email.service';

const PLATFORM_TENANT_ID = 'sharkband-platform';

export interface LoginDto {
  email: string;
  password: string;
  tenantId?: string; // Optional, can be derived from user
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
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

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password, tenantId } = loginDto;

    // Find user by email (with tenant filter if provided)
    const query: any = { email, isActive: true };
    if (tenantId) {
      query.tenantId = tenantId;
    }

    const user = await this.userModel.findOne(query).exec();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify tenant is active.
    // For the platform tenant (customer accounts), skip the DB lookup — it is
    // always considered active and avoids any index-related read issues.
    if (user.tenantId !== PLATFORM_TENANT_ID) {
      const tenant = await this.tenantModel.findById(user.tenantId).exec();
      if (!tenant || !tenant.isActive) {
        throw new UnauthorizedException('Tenant is not active');
      }
    }

    const scopes = user.scopes || [];
    const roles = user.roles || [];

    const payload: JwtPayload = {
      sub: user._id,
      tenantId: user.tenantId,
      email: user.email,
      scopes,
      roles,
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
      expires_in: 900, // 15 minutes in seconds
      token_type: 'Bearer',
    };
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

      const scopes = user.scopes || [];
      const roles = user.roles || [];

      const newPayload: JwtPayload = {
        sub: user._id,
        tenantId: user.tenantId,
        email: user.email,
        scopes,
        roles,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.configService.get<string>('app.jwt.accessTokenExpiry') || '15m',
      });

      // Optional: Rotate refresh token (issue new one)
      const newRefreshToken = this.jwtService.sign(
        { sub: user._id, tenantId: user.tenantId },
        {
          secret: this.configService.get<string>('app.jwt.refreshTokenSecret'),
          expiresIn: this.configService.get<string>('app.jwt.refreshTokenExpiry') || '7d',
        },
      );

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: 900,
        token_type: 'Bearer',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async registerCustomer(dto: { email: string; password: string; name: string }): Promise<AuthResponse> {
    // 1. Ensure platform tenant exists. Use $set so it works on both insert and update.
    //    Do NOT include _id in the update payload — Mongoose 8 forbids modifying _id.
    try {
      await this.tenantModel.findOneAndUpdate(
        { _id: PLATFORM_TENANT_ID },
        {
          $setOnInsert: { name: 'SharkBand Platform', config: {}, isActive: true, hasCompletedOnboarding: false },
          // Remove any malformed location field — an empty/invalid GeoJSON object
          // causes the 2dsphere index to throw "unknown GeoJSON type" on every write.
          $unset: { location: '' },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ).exec();
    } catch (err: any) {
      // If the tenant already exists this is a no-op; ignore duplicate-key on _id
      if (err?.code !== 11000) {
        throw new InternalServerErrorException(`Tenant init failed: ${err?.message}`);
      }
    }

    // 2. Duplicate-email guard
    const existing = await this.userModel.findOne({ email: dto.email, tenantId: PLATFORM_TENANT_ID }).exec();
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Create Customer document (holds QR secret)
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

    // 4. Create User document linked to Customer
    const userId = uuidv4();
    let user: UserDocument;
    try {
      user = await this.userModel.create({
        _id: userId,
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
      // Roll back orphaned Customer document on failure
      await this.customerModel.deleteOne({ _id: customerId }).exec().catch(() => {});
      if (err?.code === 11000) {
        throw new ConflictException('An account with this email already exists');
      }
      throw new InternalServerErrorException(`User create failed: ${err?.message}`);
    }

    // 5. Issue JWT tokens
    const payload: JwtPayload = {
      sub: user._id,
      tenantId: user.tenantId,
      email: user.email,
      scopes: user.scopes,
      roles: user.roles,
    };

    const refreshSecret = this.configService.get<string>('app.jwt.refreshTokenSecret') || 'dev-refresh-secret';
    const accessExpiry = this.configService.get<string>('app.jwt.accessTokenExpiry') || '15m';
    const refreshExpiry = this.configService.get<string>('app.jwt.refreshTokenExpiry') || '7d';

    let accessToken: string;
    let refreshToken: string;
    try {
      accessToken = this.jwtService.sign(payload, { expiresIn: accessExpiry });
      refreshToken = this.jwtService.sign(
        { sub: user._id, tenantId: user.tenantId },
        { secret: refreshSecret, expiresIn: refreshExpiry },
      );
    } catch (err: any) {
      throw new InternalServerErrorException(`Token signing failed: ${err?.message}`);
    }

    // Send welcome email (fire-and-forget — don't block registration on email failure)
    this.emailService.sendWelcomeEmail(dto.email, dto.name).catch((err) => {
      this.logger.warn?.(`Failed to send welcome email to ${dto.email}: ${err?.message}`);
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
      token_type: 'Bearer',
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    // Always return the same response to avoid leaking whether an email exists
    const genericResponse = {
      message: 'If an account with that email exists, we sent a password reset link.',
    };

    const user = await this.userModel.findOne({ email, isActive: true }).exec();
    if (!user) {
      return genericResponse;
    }

    // Generate a cryptographically random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { passwordResetToken: hashedToken, passwordResetExpiry: expiry } },
    ).exec();

    // Determine reset URL based on user role
    const isCustomer = user.roles?.includes('CUSTOMER');
    const baseUrl = isCustomer
      ? (process.env.CUSTOMER_APP_URL || 'https://app.sharkband.cloud')
      : (process.env.FRONTEND_URL || 'https://merchant.sharkband.cloud');
    const resetPath = isCustomer ? '/ResetPassword' : '/reset-password';
    const resetLink = `${baseUrl}${resetPath}?token=${rawToken}`;

    this.emailService
      .sendPasswordResetEmail(email, user.name || email, resetLink)
      .catch((err) => {
        this.logger.warn?.(`Failed to send password reset email to ${email}: ${err?.message}`);
      });

    return genericResponse;
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
