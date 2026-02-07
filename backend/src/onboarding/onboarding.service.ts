import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';
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
  role?: 'owner' | 'manager' | 'cashier' | 'staff' | 'janitor';
  scopes?: string[];
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

  private async sendStaffInviteEmail(
    recipientEmail: string,
    inviteLink: string,
    role: string,
    tenantName: string,
  ): Promise<void> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      throw new BadRequestException(
        'Email delivery is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.',
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: recipientEmail,
      subject: `You are invited to join ${tenantName} on SharkBand`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>You're invited to SharkBand</h2>
          <p>You were invited as <strong>${role}</strong> for <strong>${tenantName}</strong>.</p>
          <p>Click below to accept your invite and finish onboarding:</p>
          <p>
            <a href="${inviteLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
              Accept Invite
            </a>
          </p>
          <p>If the button does not work, use this link:</p>
          <p><a href="${inviteLink}">${inviteLink}</a></p>
          <p>This invite expires in 7 days.</p>
        </div>
      `,
      text: [
        `You were invited as ${role} for ${tenantName}.`,
        `Accept your invite: ${inviteLink}`,
        'This invite expires in 7 days.',
      ].join('\n'),
    });
  }

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
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${inviteToken}`;
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

    await this.sendStaffInviteEmail(inviteDto.email, inviteLink, roleConfig.role, tenant.name);

    return {
      inviteToken,
      email: inviteDto.email,
      role: roleConfig.role,
      inviteLink,
      emailSent: true,
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
}
