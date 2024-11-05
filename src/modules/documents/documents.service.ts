import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Document, Prisma } from '@prisma/client';

import { PrismaService } from '@shared/prisma/prisma.service';
import { DocumentCategory, OrderBy } from '@common/enums';
import { GetData } from '@common/interfaces';
import {
  capitalizedWord,
  generatePagination,
  generateReadableDateTime,
  generateSlug,
  validateAndGenerateDateRange,
} from '@common/utils';
import {
  CreateDocumentDto,
  GetDocumentDto,
  UpdateDocumentDto,
} from '@modules/documents/dtos';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async getAllDocumentCategory(): Promise<
    { category: string; slug: string }[]
  > {
    const categories = Object.values(DocumentCategory);

    return categories.map((category) => ({
      category: capitalizedWord(category),
      slug: generateSlug(category),
    }));
  }

  async getAllDocument(query: GetDocumentDto): Promise<GetData<Document[]>> {
    const {
      title,
      category,
      uploadedBy,
      dateStart,
      dateEnd,
      sort,
      order,
      page,
      limit,
    } = query;
    const { skip, take } = generatePagination(page, limit);

    let dateStarted: Date;
    let dateEnded: Date;

    if (dateStart && dateEnd) {
      const { start, end } = validateAndGenerateDateRange(
        'Created',
        dateStart,
        dateEnd,
      );

      dateStarted = start;
      dateEnded = end;
    }

    const whereCondition: any = {
      category,
      ...(title && { name: { contains: title, mode: 'insensitive' } }),
      ...(uploadedBy && {
        uploaderId: Number(uploadedBy),
      }),
      ...(dateStart &&
        dateEnd && {
          uploadedAt: {
            gte: dateStarted,
            lt: dateEnded,
          },
        }),
    };

    const [documents, total, newest] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where: whereCondition,
        include: {
          uploader: true,
        },
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      this.prisma.document.count({
        where: whereCondition,
      }),
      this.prisma.document.findFirst({
        where: whereCondition,
        orderBy: {
          uploadedAt: OrderBy.Desc,
        },
        select: {
          uploadedAt: true,
        },
      }),
    ]);

    const mappedDocuments = documents.map((doc) => ({
      ...doc,
      uploader: doc.uploader.username,
    }));

    return {
      total,
      data: mappedDocuments,
      newest: generateReadableDateTime(newest?.uploadedAt),
    };
  }

  async getDocumentBySlug(documentSlug: string): Promise<Document> {
    const document = await this.prisma.document.findFirst({
      where: {
        slug: documentSlug,
      },
      include: {
        uploader: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const mappedDocument = {
      ...document,
      uploader: document.uploader.username,
    };

    return mappedDocument;
  }

  async createDocument(
    uploaderId: number,
    dto: CreateDocumentDto,
  ): Promise<Document> {
    const [name, slug] = await this.generateDocumentName(dto.name);

    try {
      const document = await this.prisma.document.create({
        data: {
          name,
          slug,
          category: dto.category,
          url: dto.url,
          size: dto.size,
          uploaderId,
        },
      });

      return document;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated document name');
        }
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateDocumentBySlug(
    documentSlug: string,
    uploaderId: number,
    dto: UpdateDocumentDto,
  ) {
    const existingDocument = await this.getDocumentBySlug(documentSlug);

    const updatedData: UpdateDocumentDto = { ...dto };
    updatedData.uploaderId = uploaderId;

    try {
      if (dto.name && dto.name !== existingDocument.name) {
        [updatedData.name, updatedData.slug] = await this.generateDocumentName(
          dto.name,
        );
      }

      const document = await this.prisma.document.update({
        where: {
          id: existingDocument.id,
        },
        data: updatedData,
      });

      return document;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated document name');
        }
      }
      throw error;
    }
  }

  async deleteDocumentBySlug(documentSlug: string): Promise<Document> {
    const existingDocument = await this.getDocumentBySlug(documentSlug);

    const document = await this.prisma.document.delete({
      where: {
        id: existingDocument.id,
      },
    });

    return document;
  }

  private async generateDocumentName(name: string): Promise<[string, string]> {
    let duplicateCount = 0;
    let documentName = name;
    let documentSlug = generateSlug(name);

    while (
      await this.prisma.document.findFirst({ where: { name: documentName } })
    ) {
      duplicateCount++;
      documentName = `${name}(${duplicateCount})`;
      documentSlug = generateSlug(name) + `(${duplicateCount})`;
    }

    return [documentName, documentSlug];
  }
}
