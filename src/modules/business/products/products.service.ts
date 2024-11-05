import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';

import { PrismaService } from '@shared/prisma/prisma.service';
import { OrderBy } from '@common/enums';
import { GetData, MediaData } from '@common/interfaces';
import {
  generatePagination,
  generateReadableDateTime,
  generateSlug,
  validateAndGenerateDateRange,
} from '@common/utils';
import {
  CreateProductDto,
  GetProductDto,
  UpdateProductDto,
} from '@modules/business/products/dtos';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getAllProduct(query: GetProductDto): Promise<GetData<Product[]>> {
    const { title, business, dateStart, dateEnd, sort, order, page, limit } =
      query;
    const { skip, take } = generatePagination(page, limit);

    let dateStarted: Date;
    let dateEnded: Date;
    let businessId: number;

    if (dateStart && dateEnd) {
      const { start, end } = validateAndGenerateDateRange(
        'Updated',
        dateStart,
        dateEnd,
      );

      dateStarted = start;
      dateEnded = end;
    }

    if (business) {
      const businessBySlug = await this.prisma.business.findUnique({
        where: {
          slug: business,
        },
        select: {
          id: true,
        },
      });

      if (businessBySlug) {
        businessId = businessBySlug.id;
      } else {
        throw new NotFoundException(
          `Product not found with business slug '${business}'`,
        );
      }
    }

    const whereCondition: any = {
      ...(title && { title: { contains: title, mode: 'insensitive' } }),
      ...(business && { businessId }),
      ...(dateStart &&
        dateEnd && {
          updatedAt: {
            gte: dateStarted,
            lt: dateEnded,
          },
        }),
    };

    const [products, total, newest] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: whereCondition,
        include: {
          business: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      this.prisma.product.count({
        where: whereCondition,
      }),
      this.prisma.product.findFirst({
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
      data: products,
      newest: generateReadableDateTime(newest?.updatedAt),
    };
  }

  async getProductBySlug(productSlug: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug: productSlug,
      },
      include: {
        business: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const slug = generateSlug(dto.title);
    try {
      if (dto.media) {
        dto.media = await this.validateProductMedia(null, dto.media);
      }

      const product = await this.prisma.product.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description,
          media: dto.media as unknown as Prisma.InputJsonValue[],
          businessId: dto.businessId,
        },
      });

      return product;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated product title');
        }
      }
      throw error;
    }
  }

  async updateProductBySlug(productslug: string, dto: UpdateProductDto) {
    const existingProduct = await this.getProductBySlug(productslug);

    const updatedData: UpdateProductDto = { ...dto };

    try {
      if (dto.title) {
        updatedData.slug = generateSlug(updatedData.title);
      }

      if (dto.media) {
        dto.media = await this.validateProductMedia(
          existingProduct.id,
          dto.media,
        );
      }

      const product = await this.prisma.product.update({
        where: {
          id: existingProduct.id,
        },
        data: {
          ...updatedData,
          media: updatedData.media as unknown as Prisma.InputJsonValue[],
        },
      });

      return product;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated product title');
        }
      }
      throw error;
    }
  }

  async deleteProductBySlug(productslug: string): Promise<Product> {
    const existingProduct = await this.getProductBySlug(productslug);

    const product = await this.prisma.product.delete({
      where: {
        id: existingProduct.id,
      },
    });

    return product;
  }

  async validateProductMedia(
    productId: number | null,
    media: MediaData[] | null,
  ): Promise<{ slug: string; url: string }[]> | null {
    if (!media || media.length === 0) {
      return null;
    }

    const mediaList: { slug: string; url: string }[] = media.map((item) => ({
      slug: item.slug.toLowerCase(),
      url: item.url,
    }));

    const uniqueSlugs = new Set(mediaList.map((item) => item.slug));
    if (uniqueSlugs.size !== mediaList.length) {
      throw new BadRequestException(
        'Duplicate slugs found in input media array',
      );
    }

    const allProducts = await this.prisma.product.findMany({
      where: productId ? { NOT: { id: productId } } : {},
      select: {
        id: true,
        media: true,
      },
    });

    for (const newMedia of mediaList) {
      const conflictingProduct = allProducts.find((product) => {
        const productMedia = product.media as { slug: string; url: string }[];
        return productMedia.some(
          (existingMedia) => existingMedia.slug.toLowerCase() === newMedia.slug,
        );
      });

      if (conflictingProduct) {
        throw new BadRequestException(`Duplicated product media`);
      }
    }

    return mediaList;
  }
}

/*
Draft Idea for handle uplaod :
async createProduct() {
    // wait for upload success
    // upload return array object of : name, url, size
    // loop array object
    // each loop used to create media table
    // while specifically for the url loop also be stored in an array
    // used all the array value to be the data of mediaUrls in product
  }
*/
