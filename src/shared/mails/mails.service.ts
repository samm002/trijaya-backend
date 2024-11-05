import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { CreateContactUsDto } from '@modules/contact-us/dtos';

@Injectable()
export class MailsService {
  private readonly logger = new Logger(MailsService.name);
  constructor(
    private config: ConfigService,
    @InjectQueue('sendMail') private emailQueue: Queue,
  ) {}

  async sendContactUsMail(dto: CreateContactUsDto, fullName: string) {
    await this.emailQueue.add('sendContactUsToClient', {
      to: dto.email,
      subject: `Contact Us Form Feedback`,
      template: './contactUs',
      context: {
        fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        message: dto.message,
      },
    });

    this.logger.log('Adding queue sending email to client');

    await this.emailQueue.add('sendContactUsToCompany', {
      to: this.config.get<string>('MAIL_USER'),
      subject: `Contact Us Form Feedback from ${dto.email}`,
      template: './contactUs',
      context: {
        fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        message: dto.message,
      },
    });

    this.logger.log('Adding queue sending email to company');
  }
}
