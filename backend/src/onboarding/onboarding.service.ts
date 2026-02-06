import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { Location, LocationDocument } from '../database/schemas/Location.schema';
import { User, UserDocument } from '../database/schemas/User.schema';
import { PilotOnboardingFunnel, PilotOnboardingFunnelDocument } from '../database/schemas/PilotOnboardingFunnel.schema';
import { AuditService } from '../audit/audit.service';
import { PilotMetricsService } from '../pilot-metrics/pilot-metrics.service';

export interface MerchantSignupDto {
  merchantName: string;
  adminEmail: string;
  adminPassword: string;
  locationName: string;
  locationAddress?: string;
}

export interface StaffInviteDto {
  email: string;
  scopes: string[];
}

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PilotOnboardingFunnel.name) private funnelModel: Model<PilotOnboardingFunnelDocument>,
    private auditService: AuditService,
    private pilotMetricsService: PilotMetricsService,
  ) {}

  async createMerchant(signupDto: MerchantSignupDto, userId?: string) {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: signupDto.adminEmail }).exec();

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create tenant
    const tenant = new this.tenantModel({
      _id: uuidv4(),
      name: signupDto.merchantName,
      config: {},
      isActive: true,
    });
    await tenant.save();

    // Create first location
    const location = new this.locationModel({
      _id: uuidv4(),
      tenantId: tenant._id,
      name: signupDto.locationName,
      address: signupDto.locationAddress || undefined,
      isActive: true,
    });
    await location.save();

    // Create merchant admin user
    const hashedPassword = await bcrypt.hash(signupDto.adminPassword, 10);
    const adminUser = new this.userModel({
      _id: uuidv4(),
      tenantId: tenant._id,
      email: signupDto.adminEmail,
      hashedPassword,
      roles: ['MERCHANT_ADMIN'],
      scopes: ['merchant:*'],
      isActive: true,
    });
    await adminUser.save();

    // Audit log
    await this.auditService.log(
      tenant._id,
      adminUser._id,
      'MERCHANT_CREATED',
      'tenant',
      tenant._id,
      { merchantName: signupDto.merchantName },
    );

    // Track onboarding milestone
    await this.pilotMetricsService.trackOnboardingMilestone(tenant._id, 'merchant_signup');
    await this.pilotMetricsService.trackOnboardingMilestone(tenant._id, 'first_location');

    return {
      tenantId: tenant._id,
      locationId: location._id,
      userId: adminUser._id,
      email: adminUser.email,
    };
  }

  async inviteStaff(tenantId: string, inviterUserId: string, inviteDto: StaffInviteDto) {
    // Check if user already exists for this tenant
    const existingUser = await this.userModel.findOne({
      tenantId,
      email: inviteDto.email,
    }).exec();

    if (existingUser) {
      throw new ConflictException('User already exists for this tenant');
    }

    // Generate invite token
    const inviteToken = uuidv4();

    // Store invite in tenant config
    const tenant = await this.tenantModel.findOne({ _id: tenantId }).exec();
    if (!tenant) {
      throw new ConflictException('Tenant not found');
    }

    const invites = ((tenant.config as any)?.pendingInvites || []) as any[];
    invites.push({
      email: inviteDto.email,
      scopes: inviteDto.scopes || ['scan:*'],
      token: inviteToken,
      invitedBy: inviterUserId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await this.tenantModel.updateOne(
      { _id: tenantId },
      {
        config: {
          ...(tenant.config as any || {}),
          pendingInvites: invites,
        },
      }
    ).exec();

    // Audit log
    await this.auditService.log(
      tenantId,
      inviterUserId,
      'STAFF_INVITED',
      'user',
      inviteDto.email,
      { email: inviteDto.email, scopes: inviteDto.scopes },
    );

    // Track onboarding milestone (first staff invite only)
    const funnel = await this.funnelModel.findOne({ tenantId }).exec();
    if (!funnel?.firstStaffInvitedAt) {
      await this.pilotMetricsService.trackOnboardingMilestone(tenantId, 'first_staff');
    }

    return {
      inviteToken,
      email: inviteDto.email,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${inviteToken}`,
    };
  }

  async acceptInvite(inviteToken: string, password: string) {
    // Find tenant with this invite
    const tenants = await this.tenantModel.find({}).exec();
    
    let invite: any = null;
    let tenantId: string | null = null;

    for (const tenant of tenants) {
      const invites = ((tenant.config as any)?.pendingInvites || []) as any[];
      invite = invites.find((inv: any) => inv.token === inviteToken && new Date(inv.expiresAt) > new Date());
      if (invite) {
        tenantId = tenant._id;
        break;
      }
    }

    if (!invite || !tenantId) {
      throw new ConflictException('Invalid or expired invite token');
    }

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      tenantId,
      email: invite.email,
    }).exec();

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      _id: uuidv4(),
      tenantId,
      email: invite.email,
      hashedPassword,
      roles: ['STAFF'],
      scopes: invite.scopes || ['scan:*'],
      isActive: true,
    });
    await user.save();

    // Remove invite from tenant config
    const tenant = await this.tenantModel.findOne({ _id: tenantId }).exec();
    if (tenant) {
      const invites = ((tenant.config as any)?.pendingInvites || []) as any[];
      const updatedInvites = invites.filter((inv: any) => inv.token !== inviteToken);

      await this.tenantModel.updateOne(
        { _id: tenantId },
        {
          config: {
            ...(tenant.config as any || {}),
            pendingInvites: updatedInvites,
          },
        }
      ).exec();
    }

    return {
      userId: user._id,
      email: user.email,
      tenantId: user.tenantId,
    };
  }
}
