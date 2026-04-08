import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Tenant, TenantDocument } from '../database/schemas/Tenant.schema';
import { Location, LocationDocument } from '../database/schemas/Location.schema';
import { User, UserDocument } from '../database/schemas/User.schema';
import { PilotOnboardingFunnel, PilotOnboardingFunnelDocument } from '../database/schemas/PilotOnboardingFunnel.schema';
import { Ruleset, RulesetDocument } from '../database/schemas/Ruleset.schema';
import { Reward, RewardDocument } from '../database/schemas/Reward.schema';
import { AuditService } from '../audit/audit.service';
import { PilotMetricsService } from '../pilot-metrics/pilot-metrics.service';
import { GeocodingService } from '../geocoding/geocoding.service';
import { EmailService } from '../email/email.service';

export interface MerchantSignupDto {
  merchantName: string;
  adminEmail: string;
  adminPassword: string;
  locationName: string;
  locationAddress?: string;
  logoUrl?: string;
}

export interface StaffInviteDto {
  email: string;
  role?: 'owner' | 'manager' | 'cashier' | 'staff' | 'janitor';
  scopes?: string[];
}

export interface ConfigureLoyaltyDto {
  loyaltyType: 'POINTS' | 'STAMPS' | 'DISCOUNT';
  category?: string;
  pointsPerQar?: number;
  discountPer100?: number;
  stampsRequired?: number;
  stampReward?: string;
  rewards?: Array<{ name: string; pointsRequired: number; description?: string }>;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PilotOnboardingFunnel.name) private funnelModel: Model<PilotOnboardingFunnelDocument>,
    @InjectModel(Ruleset.name) private rulesetModel: Model<RulesetDocument>,
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    private auditService: AuditService,
    private pilotMetricsService: PilotMetricsService,
    private geocodingService: GeocodingService,
    private emailService: EmailService,
  ) {}

  private async findInviteByToken(inviteToken: string) {
    const tenants = await this.tenantModel.find({}).exec();

    for (const tenant of tenants) {
      const invites = ((tenant.config as any)?.pendingInvites || []) as any[];
      const invite = invites.find((inv: any) => inv.token === inviteToken);
      if (!invite) {
        continue;
      }

      if (new Date(invite.expiresAt) <= new Date()) {
        return { tenant, invite: null };
      }

      return { tenant, invite };
    }

    return { tenant: null, invite: null };
  }

  private mapInviteRole(role?: 'owner' | 'manager' | 'cashier' | 'staff' | 'janitor') {
    const normalizedRole = role || 'staff';
    if (normalizedRole === 'owner') {
      return { role: 'MERCHANT_ADMIN', scopes: ['merchant:*'] };
    }
    if (normalizedRole === 'manager') {
      return { role: 'MANAGER', scopes: ['merchant:read', 'scan:*'] };
    }
    if (normalizedRole === 'cashier') {
      return { role: 'CASHIER', scopes: ['scan:*'] };
    }
    if (normalizedRole === 'janitor') {
      return { role: 'JANITOR', scopes: ['scan:*'] };
    }
    return { role: 'STAFF', scopes: ['scan:*'] };
  }

  async createMerchant(signupDto: MerchantSignupDto, userId?: string) {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: signupDto.adminEmail }).exec();

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create tenant
    const initialConfig: Record<string, any> = {};
    if (signupDto.logoUrl) {
      initialConfig['logo_url'] = signupDto.logoUrl;
    }
    if (signupDto.locationAddress) {
      initialConfig['address'] = signupDto.locationAddress;
      initialConfig['geocoding_status'] = 'pending';
    }
    const tenant = new this.tenantModel({
      _id: uuidv4(),
      name: signupDto.merchantName,
      config: initialConfig,
      isActive: true,
    });
    await tenant.save();

    // Geocode the address asynchronously so the merchant appears on the map
    if (signupDto.locationAddress) {
      const tenantId = tenant._id as string;
      this.geocodingService.geocode(signupDto.locationAddress).then((geo) => {
        if (geo) {
          this.tenantModel.updateOne(
            { _id: tenantId },
            {
              $set: {
                'config.latitude': geo.latitude,
                'config.longitude': geo.longitude,
                'config.formatted_address': geo.formattedAddress,
                'config.geocoding_status': 'resolved',
                ...(geo.placeId ? { 'config.place_id': geo.placeId } : {}),
                location: { type: 'Point', coordinates: [geo.longitude, geo.latitude] },
              },
            },
          ).exec().catch((err) =>
            this.logger.error(`Failed to persist geocode for new tenant ${tenantId}: ${err.message}`),
          );
        } else {
          this.tenantModel.updateOne(
            { _id: tenantId },
            { $set: { 'config.geocoding_status': 'failed' } },
          ).exec().catch(() => {});
        }
      });
    }

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
      name: `${signupDto.merchantName} Admin`,
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

    // Send welcome email (fire-and-forget)
    this.emailService.sendMerchantWelcomeEmail(signupDto.adminEmail, signupDto.merchantName).catch((err) => {
      this.logger.error(`Failed to send merchant welcome email to ${signupDto.adminEmail}: ${err?.message}`);
    });

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

    const roleConfig = this.mapInviteRole(inviteDto.role);
    const scopes = inviteDto.scopes?.length ? inviteDto.scopes : roleConfig.scopes;
    const invites = ((tenant.config as any)?.pendingInvites || []) as any[];
    const inviteLink = `${process.env.FRONTEND_URL || 'https://purple-ground-02e4fe00f.6.azurestaticapps.net'}/invite/${inviteToken}`;
    invites.push({
      email: inviteDto.email,
      role: roleConfig.role,
      scopes,
      token: inviteToken,
      invitedBy: inviterUserId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await this.tenantModel
      .updateOne(
        { _id: tenantId },
        {
          $set: {
            'config.pendingInvites': invites,
          },
        },
      )
      .exec();

    // Audit log
    await this.auditService.log(
      tenantId,
      inviterUserId,
      'STAFF_INVITED',
      'user',
      inviteDto.email,
      { email: inviteDto.email, role: roleConfig.role, scopes },
    );

    // Track onboarding milestone (first staff invite only)
    const funnel = await this.funnelModel.findOne({ tenantId }).exec();
    if (!funnel?.firstStaffInvitedAt) {
      await this.pilotMetricsService.trackOnboardingMilestone(tenantId, 'first_staff');
    }

    let emailSent = false;
    let emailError: string | undefined;
    try {
      await this.emailService.sendStaffInviteEmail(inviteDto.email, inviteLink, roleConfig.role, tenant.name);
      emailSent = true;
    } catch (e: any) {
      emailError = e?.message || 'Email delivery failed';
    }

    return {
      inviteToken,
      email: inviteDto.email,
      role: roleConfig.role,
      inviteLink,
      emailSent,
      ...(emailError ? { emailError } : {}),
    };
  }

  async getInviteDetails(inviteToken: string) {
    const { tenant, invite } = await this.findInviteByToken(inviteToken);
    if (!tenant || !invite) {
      throw new ConflictException('Invalid or expired invite token');
    }

    return {
      email: invite.email,
      role: invite.role || 'STAFF',
      tenantName: tenant.name,
      expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(inviteToken: string, name: string, password?: string) {
    const cleanName = (name || '').trim();
    if (!cleanName) {
      throw new BadRequestException('Name is required');
    }

    const { tenant, invite } = await this.findInviteByToken(inviteToken);
    if (!tenant || !invite) {
      throw new ConflictException('Invalid or expired invite token');
    }

    const tenantId = tenant._id;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      tenantId,
      email: invite.email,
    }).exec();

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Create user
    const finalPassword = password?.trim() || uuidv4();
    const hashedPassword = await bcrypt.hash(finalPassword, 10);
    const user = new this.userModel({
      _id: uuidv4(),
      tenantId,
      name: cleanName,
      email: invite.email,
      hashedPassword,
      roles: [invite.role || 'STAFF'],
      scopes: invite.scopes || ['scan:*'],
      isActive: true,
    });
    await user.save();

    // Remove invite from tenant config
    if (tenant) {
      const invites = ((tenant.config as any)?.pendingInvites || []) as any[];
      const updatedInvites = invites.filter((inv: any) => inv.token !== inviteToken);

      await this.tenantModel
        .updateOne(
          { _id: tenantId },
          {
            $set: {
              'config.pendingInvites': updatedInvites,
            },
          },
        )
        .exec();
    }

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      role: invite.role || 'STAFF',
    };
  }

  async configureLoyalty(tenantId: string, userId: string, dto: ConfigureLoyaltyDto) {
    // Build ruleset config based on loyalty type
    let ruleType: string;
    let config: Record<string, any>;

    if (dto.loyaltyType === 'POINTS') {
      ruleType = 'POINTS_PER_CURRENCY';
      config = { pointsPerCurrency: dto.pointsPerQar ?? 1 };
    } else if (dto.loyaltyType === 'DISCOUNT') {
      ruleType = 'DISCOUNT_PER_CURRENCY';
      config = { discountPer100: dto.discountPer100 ?? 10 };
    } else {
      ruleType = 'STAMP_CARD';
      config = {
        stampsRequired: dto.stampsRequired ?? 10,
        stampReward: dto.stampReward ?? 'Free item',
      };
    }

    // Upsert ruleset for tenant (deactivate old, create new)
    await this.rulesetModel
      .updateMany({ tenantId }, { $set: { effectiveTo: new Date() } })
      .exec();

    const ruleset = new this.rulesetModel({
      _id: uuidv4(),
      tenantId,
      ruleType,
      config,
      effectiveFrom: new Date(),
    });
    await ruleset.save();

    // Also persist loyalty_type directly on tenant.config so that
    // scan.service.ts and getCustomerMemberships() can read it without
    // having to resolve the Ruleset document.
    const tenantConfigUpdate: Record<string, any> = {
      'config.loyalty_type': dto.loyaltyType.toLowerCase(),
    };
    if (dto.loyaltyType === 'STAMPS') {
      tenantConfigUpdate['config.stamps_required'] = dto.stampsRequired ?? 10;
    }
    if (dto.loyaltyType === 'POINTS') {
      tenantConfigUpdate['config.points_per_qar'] = dto.pointsPerQar ?? 1;
    }
    if (dto.category) {
      tenantConfigUpdate['config.category'] = dto.category;
    }
    await this.tenantModel.updateOne({ _id: tenantId }, { $set: tenantConfigUpdate }).exec();

    // Create rewards
    const createdRewards: any[] = [];

    // For STAMPS: create a reward document representing the stamp card prize
    if (dto.loyaltyType === 'STAMPS' && dto.stampReward) {
      const stampsReward = new this.rewardModel({
        _id: uuidv4(),
        tenantId,
        name: dto.stampReward,
        rewardType: 'stamps',
        stampsCost: dto.stampsRequired ?? 10,
        isActive: true,
      });
      await stampsReward.save();
      createdRewards.push({ id: stampsReward._id, name: stampsReward.name });
    }

    // For POINTS: create reward documents passed in the rewards array
    if (dto.rewards?.length) {
      for (const r of dto.rewards) {
        const reward = new this.rewardModel({
          _id: uuidv4(),
          tenantId,
          name: r.name,
          rewardType: 'points',
          pointsRequired: r.pointsRequired,
          description: r.description,
          isActive: true,
        });
        await reward.save();
        createdRewards.push({ id: reward._id, name: reward.name });
      }
    }

    await this.auditService.log(tenantId, userId, 'LOYALTY_CONFIGURED', 'ruleset', ruleset._id, {
      loyaltyType: dto.loyaltyType,
    });

    return { rulesetId: ruleset._id, ruleType, config, rewards: createdRewards };
  }

  async completeMerchantOnboarding(tenantId: string, userId: string) {
    const tenant = await this.tenantModel.findById(tenantId).exec();
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    await this.tenantModel
      .updateOne({ _id: tenantId }, { $set: { hasCompletedOnboarding: true } })
      .exec();

    await this.auditService.log(tenantId, userId, 'ONBOARDING_COMPLETED', 'tenant', tenantId, {});

    await this.pilotMetricsService.trackOnboardingMilestone(tenantId, 'first_scan');

    return { hasCompletedOnboarding: true };
  }
}
