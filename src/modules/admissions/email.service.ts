import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type MailPayload = {
  to: string;
  subject: string;
  text: string;
};

@Injectable()
export class AdmissionEmailService {
  private readonly logger = new Logger(AdmissionEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmailVerificationOtp(email: string, otp: string) {
    await this.send({
      to: email,
      subject: 'Verify your SystemGrid Academy admission email',
      text: `Your SystemGrid Academy verification code is ${otp}. This code will expire in 15 minutes.`,
    });
  }

  async sendPaymentLinkEmail(email: string, courseTitle: string, finalPayable: number, paymentLink: string) {
    await this.send({
      to: email,
      subject: 'Complete your SystemGrid Academy admission payment',
      text: [
        'Your admission application is ready for payment.',
        `Course: ${courseTitle}`,
        `Final payable: PKR ${finalPayable.toLocaleString('en-PK')}`,
        `Payment link: ${paymentLink}`,
      ].join('\n'),
    });
  }

  async sendWelcomeEmail(email: string) {
    await this.send({
      to: email,
      subject: 'Welcome to SystemGrid Academy',
      text: 'Your payment has been verified and your student account is active. Please use the password reset flow to set your portal password securely.',
    });
  }

  async sendReferralRewardEmail(email: string) {
    await this.send({
      to: email,
      subject: 'Referral reward added to your wallet',
      text: 'Your referral was verified. PKR 1,000 credit has been added to your SystemGrid Academy wallet.',
    });
  }

  private async send(payload: MailPayload) {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    if (!host || !user || !pass) {
      this.logger.log(`[mail:dev] ${payload.subject} -> ${payload.to}: ${payload.text}`);
      return;
    }

    try {
      const optionalImport = new Function('moduleName', 'return import(moduleName)') as (moduleName: string) => Promise<any>;
      const nodemailer = await optionalImport('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: Number(this.configService.get<string>('MAIL_PORT') ?? 587),
        secure: String(this.configService.get<string>('MAIL_SECURE') ?? 'false') === 'true',
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: `"${this.configService.get<string>('MAIL_FROM_NAME') ?? 'SystemGrid Academy'}" <${this.configService.get<string>('MAIL_FROM_EMAIL') ?? user}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
      });
    } catch (error) {
      this.logger.warn(`Email delivery skipped: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
}
