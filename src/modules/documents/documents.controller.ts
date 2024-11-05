import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Document } from '@prisma/client';

import { GetUser, Public } from '@common/decorators';
import { JwtGuard } from '@common/guards';
import { ResponsePayload } from '@common/interfaces';
import { successResponsePayload } from '@common/utils';
import {
  CreateDocumentDto,
  GetDocumentDto,
  UpdateDocumentDto,
} from '@modules/documents/dtos';
import { DocumentsService } from '@modules/documents/documents.service';

@UseGuards(JwtGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentService: DocumentsService) {}

  @Public()
  @Get('categories')
  async getAllDocumentCategory(): Promise<
    ResponsePayload<{ category: string; slug: string }[]>
  > {
    const categories = await this.documentService.getAllDocumentCategory();

    return successResponsePayload('Get all document category', categories);
  }

  @Public()
  @Get()
  async getAllDocument(
    @Query() query: GetDocumentDto,
  ): Promise<ResponsePayload<Document[]>> {
    const { total, data, newest } =
      await this.documentService.getAllDocument(query);

    return successResponsePayload('Get all document', data, total, newest);
  }

  @Public()
  @Get(':documentSlug')
  async getDocumentBySlug(
    @Param('documentSlug') documentSlug: string,
  ): Promise<ResponsePayload<Document>> {
    const document = await this.documentService.getDocumentBySlug(documentSlug);

    return successResponsePayload(
      `Get document by slug ${documentSlug}`,
      document,
    );
  }

  @Post()
  async createDocument(
    @GetUser('id') uploaderId: number,
    @Body() dto: CreateDocumentDto,
  ): Promise<ResponsePayload<Document>> {
    const document = await this.documentService.createDocument(uploaderId, dto);

    return successResponsePayload('Create document', document);
  }

  @Patch(':documentSlug')
  async updateDocumentBySlug(
    @GetUser('id') uploaderId: number,
    @Param('documentSlug') documentSlug: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<ResponsePayload<Document>> {
    const document = await this.documentService.updateDocumentBySlug(
      documentSlug,
      uploaderId,
      dto,
    );

    return successResponsePayload(
      `Update document by slug ${documentSlug}`,
      document,
    );
  }

  @Delete(':documentSlug')
  async deleteDocumentBySlug(
    @Param('documentSlug') documentSlug: string,
  ): Promise<ResponsePayload<Document>> {
    const document =
      await this.documentService.deleteDocumentBySlug(documentSlug);

    return successResponsePayload(
      `Delete document by slug ${documentSlug}`,
      document,
    );
  }
}
