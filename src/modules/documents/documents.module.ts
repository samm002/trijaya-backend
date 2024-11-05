import { Module } from '@nestjs/common';

import { DocumentsController } from '@modules/documents/documents.controller';
import { DocumentsService } from '@modules/documents/documents.service';

@Module({
  providers: [DocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
