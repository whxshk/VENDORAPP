import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
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
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
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

    // Verify tenant is active
    const tenant = await this.tenantModel.findById(user.tenantId).exec();
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Tenant is not active');
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
    // Ensure the platform tenant exists and is active.
    // Note: _id must NOT be included in $setOnInsert when it is already in the filter —
    // MongoDB treats that as a "Mod on _id not allowed" error in some versions.
    await this.tenantModel.findOneAndUpdate(
      { _id: PLATFORM_TENANT_ID },
      { $setOnInsert: { name: 'SharkBand Platform', config: {}, isActive: true } },
      { upsert: true, new: true },
    ).exec();

    // Check for duplicate email on the platform tenant
    const existing = await this.userModel.findOne({ email: dto.email, tenantId: PLATFORM_TENANT_ID }).exec();
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create Customer document
    const customerId = uuidv4();
    const qrTokenSecret = crypto.randomBytes(32).toString('hex');
    await this.customerModel.create({ _id: customerId, qrTokenSecret, rotationIntervalSec: 300 });

    // Create User document linked to Customer
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
      // Roll back the orphaned Customer document
      await this.customerModel.deleteOne({ _id: customerId }).exec().catch(() => {});
      // MongoDB E11000 duplicate key — race condition with concurrent registration
      if (err?.code === 11000) {
        throw new ConflictException('An account with this email already exists');
      }
      throw new InternalServerErrorException('Failed to create account. Please try again.');
    }

    const payload: JwtPayload = {
      sub: user._id,
      tenantId: user.tenantId,
      email: user.email,
      scopes: user.scopes,
      roles: user.roles,
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
