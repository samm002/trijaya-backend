import { S3Client } from '@aws-sdk/client-s3';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service
  extends S3Client
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(S3Service.name);
  private readonly bucket: string;
  private readonly region: string;

  constructor(config: ConfigService) {
    super({
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
      },
      region: config.get('S3_REGION'),
    });

    this.bucket = config.get<string>('S3_BUCKET');
    this.region = config.get<string>('S3_REGION');
  }

  async onModuleInit() {
    try {
      this.logger.log('S3 client connected successfully.');
    } catch (error) {
      this.logger.error('Failed connecting to S3:', error);
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('S3 client disconnected successfully.');
    } catch (error) {
      this.logger.error('Failed disconnecting from S3:', error);
    }
  }

  getBucket(): string {
    return this.bucket;
  }

  getRegion(): string {
    return this.region;
  }
}
