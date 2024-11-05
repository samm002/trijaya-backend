import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { FailedJob, SuccessJob } from '@prisma/client';
import { Worker, Job } from 'bullmq';

import { PrismaService } from '@shared/prisma/prisma.service';
import { FailedJobInterface, SuccessJobInterface } from '@common/interfaces';

@Injectable()
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);
  private worker: Worker;

  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.worker = new Worker('sendMail', this.process.bind(this), {
      connection: {
        host: this.config.get<string>('REDIS_HOST'),
        port: this.config.get<number>('REDIS_PORT'),
        password: this.config.get<string>('REDIS_PASSWORD'),
      },
    });

    this.worker.on('completed', async (job) => {
      this.logger.log(`Job ${job.id} : ${job.name} completed`);
      await this.createSuccessJob(job);
    });

    this.worker.on('failed', async (job, err) => {
      const maxAttempts = job.opts.attempts;

      if (job.attemptsMade === maxAttempts) {
        this.logger.log(
          `Job ${job.id} : ${job.name} failed after max (5) retrying attempts`,
        );
        await this.createFailedJob(job, err);
      } else {
        this.logger.log(
          `Job ${job.id} : ${job.name} failed, rerunning job (Attempt ${job.attemptsMade}/${maxAttempts})`,
        );
      }
    });
  }

  async process(job: Job) {
    const { data, name } = job;
    const { to, subject, context } = data;

    try {
      const jobHandler = {
        sendContactUsToClient: async () => {
          await this.mailerService.sendMail({
            to,
            subject,
            template: './contactUs',
            context,
          });
        },
        sendContactUsToCompany: async () => {
          await this.mailerService.sendMail({
            to,
            subject,
            template: './contactUs',
            context,
          });
        },
      };

      const handler = jobHandler[name];

      if (handler) {
        await handler();
      } else {
        console.warn(`Unknown job type: ${name}`);
      }
    } catch (error) {
      this.logger.error('Error processing job:', error);
      throw error;
    }
  }

  private async createSuccessJob(job: Job): Promise<SuccessJob> {
    try {
      const successJob: SuccessJobInterface = {
        jobId: job.id,
        name: job.name,
        data: job.data,
      };

      const createdSuccessJob = await this.prisma.successJob.create({
        data: successJob,
      });

      this.logger.log(`Success job ${job.id} : ${job.name} saved to database`);

      return createdSuccessJob;
    } catch (error) {
      this.logger.error(
        'Failed to save success job in database, detail :',
        error,
      );
    }
  }

  private async createFailedJob(job: Job, error: Error): Promise<FailedJob> {
    try {
      const failedJob: FailedJobInterface = {
        jobId: job.id,
        name: job.name,
        error: error.message,
        data: job.data,
      };

      const createdFailedJob = await this.prisma.failedJob.create({
        data: failedJob,
      });

      this.logger.log(`Failed job ${job.id} : ${job.name} saved to database`);

      return createdFailedJob;
    } catch (error) {
      this.logger.error(
        'Failed to save failed job in database, detail :',
        error,
      );
    }
  }
}
