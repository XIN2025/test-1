import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { config } from 'src/common/config';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(options: { to: string | string[]; subject: string; html: string }): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        from: `"${config.mail.defaults.fromName}" <${config.mail.defaults.from}>`,
        ...options,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
}
