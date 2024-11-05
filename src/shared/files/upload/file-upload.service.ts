import { Upload } from '@aws-sdk/lib-storage';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';

import {
  BusinessSlug,
  BusinessType,
  DocumentCategory,
  MediaType,
} from '@common/enums';
import { generateFileSize } from '@common/utils';
import { S3Service } from '@shared/s3/s3.service';

@Injectable()
export class FileUploadService {
  private readonly bucket: string;
  private readonly region: string;

  constructor(private s3: S3Service) {
    this.bucket = this.s3.getBucket();
    this.region = this.s3.getRegion();
  }

  async uploadFile(
    file: Express.Multer.File,
    type: MediaType,
    category: BusinessSlug | DocumentCategory | string,
  ): Promise<{ name: string; url: string; size: string }> {
    if (!file) {
      throw new BadRequestException('please input file');
    }

    if (
      (type === MediaType.Business || type === MediaType.Project) &&
      !this.isValidBusinessSlug(category)
    ) {
      throw new BadRequestException(
        `Upload failed, no business named ${category}`,
      );
    }

    if (
      type === MediaType.Document &&
      !this.isValidDocumentCategory(category)
    ) {
      throw new BadRequestException(
        '`Upload failed, no document with category ${category}`',
      );
    }

    const folderName =
      type === MediaType.Business
        ? `${type}/${category}/header`
        : type === MediaType.Document
          ? `${type}/${category}`
          : type === MediaType.Album
            ? `${type}/${category}/header`
            : type === MediaType.Project
              ? `business/${category}/${type}/header`
              : `${type}`;
    const fileStream = fs.createReadStream(file.path);
    const contentType = file.mimetype || 'application/octet-stream';
    const fileSize = generateFileSize(file.size);

    const upload = new Upload({
      client: this.s3,
      params: {
        ACL: 'public-read',
        Bucket: this.bucket,
        Key: `${folderName}/${file.filename}`, // File path in S3
        Body: fileStream,
        ContentType: contentType,
      },
    });

    const data = await upload.done();

    const objectUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${data.Key}`;

    return { name: file.filename, url: objectUrl, size: fileSize };
  }

  async uploadFiles(
    files: Express.Multer.File[],
    type: MediaType,
    businessSlug: BusinessSlug,
    businessType: BusinessType,
    album: string,
  ): Promise<{ uploadedFiles: { name: string; url: string; size: string }[] }> {
    const uploadedFiles = [];

    if (!files) {
      throw new BadRequestException('please input file');
    }

    if (type !== MediaType.Business && type !== MediaType.Media) {
      throw new BadRequestException(
        'Only media, product, and project can upload multiple',
      );
    }

    if (type == MediaType.Business) {
      if (!businessSlug) {
        throw new BadRequestException('Please input business name');
      }
      if (!businessType) {
        throw new BadRequestException('Please input business type');
      }
    }

    const folderName =
      type === MediaType.Business
        ? `${type}/${businessSlug}/${businessType}`
        : `album/${album}/${type}`;

    for (const file of files) {
      const fileStream = fs.createReadStream(file.path);

      if (!fileStream) {
        throw new Error('Failed to create file stream');
      }

      const contentType = file.mimetype || 'application/octet-stream';
      const fileSize = generateFileSize(file.size);

      const upload = new Upload({
        client: this.s3,
        params: {
          ACL: 'public-read',
          Bucket: this.bucket,
          Key: `${folderName}/${file.filename}`,
          Body: fileStream,
          ContentType: contentType,
        },
        tags: [],
        queueSize: 4,
        partSize: 1024 * 1024 * 5,
        leavePartsOnError: false,
      });

      try {
        const data = await upload.done();
        const objectUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${data.Key}`;
        uploadedFiles.push({
          name: file.filename,
          url: objectUrl,
          size: fileSize,
        });
      } catch (error) {
        console.error({ error });
        throw new Error(`Failed to upload file: ${error.message}`);
      } finally {
        fs.unlinkSync(file.path);
      }
    }

    return { uploadedFiles };
  }

  private isValidBusinessSlug(businessSlug: string): boolean {
    return Object.values(BusinessSlug).includes(businessSlug as BusinessSlug);
  }

  private isValidDocumentCategory(documentCategory: string): boolean {
    return Object.values(DocumentCategory).includes(
      documentCategory as DocumentCategory,
    );
  }
}
