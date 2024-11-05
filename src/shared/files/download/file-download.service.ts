import { BadRequestException, Injectable } from '@nestjs/common';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

import { S3Service } from '@shared/s3/s3.service';

@Injectable()
export class FileDownloadService {
  private readonly bucket: string;

  constructor(private s3: S3Service) {
    this.bucket = this.s3.getBucket();
  }

  async download(url: string): Promise<Readable> {
    const params = {
      Bucket: this.bucket,
      Key: url.startsWith('/') ? url.substring(1) : url,
    };

    const command = new GetObjectCommand(params);
    const response = await this.s3.send(command);

    if (!response.Body) {
      throw new BadRequestException('File not found or inaccessible');
    }

    return response.Body as Readable;
  }
}
