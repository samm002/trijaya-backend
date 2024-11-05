import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueuesService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueuesService.name);

  constructor(@InjectQueue('sendMail') private sendMailQueue: Queue) {}

  async onModuleInit() {
    const connection = await this.sendMailQueue.client;

    connection.on('connect', () => {
      this.logger.log('Redis connected successfully.');
    });

    connection.on('ready', () => {
      this.logger.log('Redis is ready to process jobs.');
    });

    connection.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    connection.on('end', () => {
      this.logger.log('Redis connection closed.');
    });

    try {
      if (connection.status === 'ready') {
        this.logger.log('Redis client connected successfully.');
      }
    } catch (error) {
      this.logger.error('Failed connecting to Redis client:', error);
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Redis client disconnected successfully.');
    } catch (error) {
      this.logger.error('Failed to disconnect from Redis client:', error);
    }
  }
}
