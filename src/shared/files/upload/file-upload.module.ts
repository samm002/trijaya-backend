import { Global, Module } from '@nestjs/common';

import { FileUploadController } from '@shared/files/upload/file-upload.controller';
import { FileUploadService } from '@shared/files/upload/file-upload.service';

@Global()
@Module({
  providers: [FileUploadService],
  controllers: [FileUploadController],
  exports: [FileUploadService],
})
export class FileUploadModule {}
