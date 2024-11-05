import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';

import { MailsService } from '@shared/mails/mails.service';
import { MailProcessor } from '@shared/mails/processors/mail.processor';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get('MAIL_PORT'),
          secure: config.get('MAIL_SECURE') === 'true',
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `${config.get('MAIL_NAME')} <${config.get('MAIL_FROM')}>`,
        },
        preview: false,
        template: {
          dir: join(__dirname, '..', '..', '..', 'views', 'mails', 'templates'),
          adapter: new EjsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'sendMail',
    }),
  ],
  providers: [MailsService, MailProcessor],
  exports: [MailsService],
})
export class MailsModule {}
