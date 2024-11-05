import { Module } from '@nestjs/common';

import { FileDownloadController } from '@shared/files/download/file-download.controller';
import { FileDownloadService } from '@shared/files/download/file-download.service';

@Module({
  providers: [FileDownloadService],
  controllers: [FileDownloadController],
})
export class FileDownloadModule {}
