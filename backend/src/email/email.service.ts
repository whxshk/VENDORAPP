import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  isConfigured(): boolean {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  private async send(to: string, subject: string, html: string, text: string): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(`SMTP not configured — skipping email to ${to}: ${subject}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || '587'),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.send(
      to,
      'Welcome to SharkBand! 🦈',
      `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0A1931 0%,#0f2440 100%);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#f97316;margin:0;font-size:32px;">🦈 SharkBand</h1>
          </div>
          <div style="padding:32px;background:#f9fafb;border-radius:0 0 8px 8px;">
            <h2 style="color:#111;">Welcome, ${name}!</h2>
            <p>Thanks for joining SharkBand — your loyalty rewards wallet.</p>
            <p>You can now earn and track loyalty points and stamps at your favourite SharkBand merchants.</p>
            <p style="margin-top:24px;color:#6b7280;font-size:14px;">
              Open the SharkBand app and scan your QR code at checkout to start earning rewards.
            </p>
          </div>
        </div>
      `,
      `Welcome to SharkBand, ${name}!\n\nThanks for joining. Open the app and scan your QR code at checkout to start earning rewards.`,
    );
  }

  async sendMerchantWelcomeEmail(to: string, merchantName: string): Promise<void> {
    const dashboardUrl = process.env.FRONTEND_URL || 'https://merchant.sharkband.cloud';
    await this.send(
      to,
      `Welcome to SharkBand — ${merchantName} is ready!`,
      `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0a0f1a 0%,#1e3a5f 100%);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#60a5fa;margin:0;font-size:32px;">🦈 SharkBand</h1>
          </div>
          <div style="padding:32px;background:#f9fafb;border-radius:0 0 8px 8px;">
            <h2 style="color:#111;">Welcome to SharkBand!</h2>
            <p>Your merchant account for <strong>${merchantName}</strong> has been created successfully.</p>
            <p>Complete your setup by configuring your loyalty program from the dashboard.</p>
            <p style="text-align:center;margin:32px 0;">
              <a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
                Go to Dashboard
              </a>
            </p>
            <p style="color:#6b7280;font-size:14px;">If you have any questions, contact SharkBand support.</p>
          </div>
        </div>
      `,
      `Welcome to SharkBand!\n\nYour merchant account for ${merchantName} has been created.\nGo to ${dashboardUrl} to complete setup.`,
    );
  }

  async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<void> {
    await this.send(
      to,
      'Reset your SharkBand password',
      `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0a0f1a 0%,#1e3a5f 100%);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#60a5fa;margin:0;font-size:32px;">🦈 SharkBand</h1>
          </div>
          <div style="padding:32px;background:#f9fafb;border-radius:0 0 8px 8px;">
            <h2 style="color:#111;">Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your SharkBand password. Click the button below to choose a new password.</p>
            <p style="text-align:center;margin:32px 0;">
              <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
                Reset Password
              </a>
            </p>
            <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour. If you didn't request a reset, you can ignore this email.</p>
            <p style="color:#9ca3af;font-size:12px;">If the button doesn't work, copy this link: ${resetLink}</p>
          </div>
        </div>
      `,
      `Hi ${name},\n\nReset your SharkBand password:\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    );
  }

  async sendOtpEmail(
    to: string,
    name: string,
    code: string,
    purpose: 'login' | 'signup',
  ): Promise<void> {
    const title = purpose === 'signup' ? 'Verify your SharkBand account' : 'Your SharkBand login code';
    const intro = purpose === 'signup'
      ? 'Use this code to verify your email address and finish creating your SharkBand account.'
      : 'Use this code to finish signing in to your SharkBand account.';

    await this.send(
      to,
      title,
      `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:600px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#0A1931 0%,#0f2440 100%);padding:32px;text-align:center;border-radius:8px 8px 0 0;">
            <h1 style="color:#f97316;margin:0;font-size:32px;">SharkBand</h1>
          </div>
          <div style="padding:32px;background:#f9fafb;border-radius:0 0 8px 8px;">
            <h2 style="color:#111;">Hi ${name},</h2>
            <p>${intro}</p>
            <div style="margin:32px 0;padding:18px 24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;text-align:center;">
              <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">Your 6-digit verification code</div>
              <div style="font-size:36px;letter-spacing:10px;font-weight:700;color:#0A1931;">${code}</div>
            </div>
            <p style="color:#6b7280;font-size:14px;">This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
          </div>
        </div>
      `,
      `Hi ${name},\n\n${intro}\n\nYour SharkBand verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    );
  }

  async sendStaffInviteEmail(
    to: string,
    inviteLink: string,
    role: string,
    tenantName: string,
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        'Email delivery is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.',
      );
    }
    await this.send(
      to,
      `You are invited to join ${tenantName} on SharkBand`,
      `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
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
      `You were invited as ${role} for ${tenantName}.\nAccept your invite: ${inviteLink}\nThis invite expires in 7 days.`,
    );
  }
}
