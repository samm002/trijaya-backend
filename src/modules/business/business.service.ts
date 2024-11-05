import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Business, Prisma } from '@prisma/client';

import { PrismaService } from '@shared/prisma/prisma.service';
import { OrderBy } from '@common/enums';
import { BusinessMetadata, GetData, Header } from '@common/interfaces';
import {
  generateDefaultHeader,
  generatePagination,
  generateReadableDateTime,
  generateSlug,
  validateAndGenerateDateRange,
} from '@common/utils';
import {
  CreateBusinessDto,
  GetBusinessDto,
  UpdateBusinessDto,
} from '@modules/business/dtos';

@Injectable()
export class BusinessService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getAllBusinessMetadata(): Promise<BusinessMetadata[]> {
    const business = await this.prisma.business.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    return business;
  }

  async getAllBusiness(query: GetBusinessDto): Promise<GetData<Business[]>> {
    const { title, dateStart, dateEnd, sort, order, page, limit } = query;
    const { skip, take } = generatePagination(page, limit);

    let dateStarted: Date;
    let dateEnded: Date;

    if (dateStart && dateEnd) {
      const { start, end } = validateAndGenerateDateRange(
        'Updated',
        dateStart,
        dateEnd,
      );

      dateStarted = start;
      dateEnded = end;
    }

    const whereCondition: any = {
      ...(title && { title: { contains: title, mode: 'insensitive' } }),
      ...(dateStart &&
        dateEnd && {
          updatedAt: {
            gte: dateStarted,
            lt: dateEnded,
          },
        }),
    };

    const [business, total, newest] = await this.prisma.$transaction([
      this.prisma.business.findMany({
        where: whereCondition,
        include: {
          Project: {
            include: {
              business: {
                select: {
                  title: true,
                },
              },
            },
          },
          Product: {
            include: {
              business: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      this.prisma.business.count({
        where: whereCondition,
      }),
      this.prisma.business.findFirst({
        where: whereCondition,
        orderBy: {
          updatedAt: OrderBy.Desc,
        },
        select: {
          updatedAt: true,
        },
      }),
    ]);

    return {
      total,
      data: business,
      newest: generateReadableDateTime(newest?.updatedAt),
    };
  }

  async getBusinessBySlug(businessSlug: string): Promise<Business> {
    const business = await this.prisma.business.findFirst({
      where: {
        slug: businessSlug,
      },
      include: {
        Project: {
          include: {
            business: {
              select: {
                title: true,
              },
            },
          },
        },
        Product: {
          include: {
            business: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business;
  }

  async createBusiness(dto: CreateBusinessDto): Promise<Business> {
    const slug = generateSlug(dto.title);

    try {
      const [header, productHeader] = await this.validateBusinessHeaders(
        null,
        dto.header ?? null,
        dto.productHeader ?? null,
      );

      const business = await this.prisma.business.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description,
          header:
            (header as unknown as Prisma.InputJsonValue) ??
            generateDefaultHeader(slug, 'header'),
          productHeader:
            (productHeader as unknown as Prisma.InputJsonValue) ??
            generateDefaultHeader(slug, 'product-header'),
        },
      });

      return business;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated business title');
        }
      }
      throw error;
    }
  }

  async updateBusinessBySlug(
    businessslug: string,
    dto: UpdateBusinessDto,
  ): Promise<Business> {
    const existingBusiness = await this.getBusinessBySlug(businessslug);

    const updatedData: UpdateBusinessDto = { ...dto };

    try {
      if (dto.title) {
        updatedData.slug = generateSlug(updatedData.title);
      }

      const [header, productHeader] = await this.validateBusinessHeaders(
        existingBusiness.id,
        dto.header ?? null,
        dto.productHeader ?? null,
      );

      const business = await this.prisma.business.update({
        where: {
          id: existingBusiness.id,
        },
        data: {
          ...updatedData,
          header: header
            ? (header as unknown as Prisma.InputJsonValue)
            : existingBusiness.header,
          productHeader: productHeader
            ? (productHeader as unknown as Prisma.InputJsonValue)
            : existingBusiness.productHeader,
        },
      });

      return business;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated business title');
        }
      }
      throw error;
    }
  }

  async deleteBusinessBySlug(businessslug: string): Promise<Business> {
    const existingBusiness = await this.getBusinessBySlug(businessslug);

    const business = await this.prisma.business.delete({
      where: {
        id: existingBusiness.id,
      },
    });

    return business;
  }

  private async validateBusinessHeaders(
    businessId: number | null,
    header: Header | null,
    productHeader: Header | null,
  ): Promise<{ slug: string; url: string }[]> {
    const headers: { slug: string; url: string }[] = [null, null];

    if (header) {
      const duplicatedImageHeader = await this.prisma.business.findFirst({
        where: {
          header: {
            path: ['slug'],
            string_contains: header.slug.toLowerCase(),
          },
          NOT: {
            ...(businessId ? { id: businessId } : {}),
          },
        },
      });

      if (duplicatedImageHeader) {
        throw new BadRequestException('Duplicated business header');
      }

      headers[0] = {
        slug: header.slug.toLowerCase(),
        url: header.url,
      };
    }

    if (productHeader) {
      const duplicatedProductHeader = await this.prisma.business.findFirst({
        where: {
          productHeader: {
            path: ['slug'],
            string_contains: productHeader.slug.toLowerCase(),
          },
          NOT: {
            ...(businessId ? { id: businessId } : {}),
          },
        },
      });

      if (duplicatedProductHeader) {
        throw new BadRequestException('Duplicated business product header');
      }

      headers[1] = {
        slug: productHeader.slug.toLowerCase(),
        url: productHeader.url,
      };
    }

    return headers;
  }
}
