import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Blog, Prisma } from '@prisma/client';

import { PrismaService } from '@shared/prisma/prisma.service';
import { OrderBy } from '@common/enums';
import { GetData } from '@common/interfaces';
import {
  generatePagination,
  generateReadableDateTime,
  generateSlug,
  validateAndGenerateDateRange,
} from '@common/utils';
import { CreateBlogDto, GetBlogDto, UpdateBlogDto } from '@modules/blogs/dtos';

@Injectable()
export class BlogsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getAllBlog(query: GetBlogDto): Promise<GetData<Blog[]>> {
    const {
      title,
      author,
      dateCreateStart,
      dateCreateEnd,
      dateUpdateStart,
      dateUpdateEnd,
      sort,
      order,
      page,
      limit,
    } = query;
    const { skip, take } = generatePagination(page, limit);

    let dateCreatedStart: Date;
    let dateCreatedEnd: Date;
    let dateUpdatedStart: Date;
    let dateUpdatedEnd: Date;

    if (dateCreateStart && dateCreateEnd) {
      const { start, end } = validateAndGenerateDateRange(
        'Created',
        dateCreateStart,
        dateCreateEnd,
      );

      dateCreatedStart = start;
      dateCreatedEnd = end;
    }

    if (dateUpdateStart && dateUpdateEnd) {
      const { start, end } = validateAndGenerateDateRange(
        'Updated',
        dateUpdateStart,
        dateUpdateEnd,
      );

      dateUpdatedStart = start;
      dateUpdatedEnd = end;
    }

    const whereCondition: any = {
      ...(title && { title: { contains: title, mode: 'insensitive' } }),
      ...(author && { authorId: Number(author) }),
      ...(dateCreateStart &&
        dateCreateEnd && {
          createdAt: {
            gte: dateCreatedStart,
            lt: dateCreatedEnd,
          },
        }),
      ...(dateUpdateStart &&
        dateUpdateEnd && {
          updatedAt: {
            gte: dateUpdatedStart,
            lt: dateUpdatedEnd,
          },
        }),
    };

    const [blogs, total, newest] = await this.prisma.$transaction([
      this.prisma.blog.findMany({
        where: whereCondition,
        include: {
          author: true,
        },
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      this.prisma.blog.count({
        where: whereCondition,
      }),
      this.prisma.blog.findFirst({
        where: whereCondition,
        orderBy: {
          updatedAt: OrderBy.Desc,
        },
        select: {
          updatedAt: true,
        },
      }),
    ]);

    const mappedBlogs = blogs.map((doc) => ({
      ...doc,
      author: doc.author.username,
    }));

    return {
      total,
      data: mappedBlogs,
      newest: generateReadableDateTime(newest?.updatedAt),
    };
  }

  async getBlogBySlug(blogSlug: string): Promise<Blog> {
    const blog = await this.prisma.blog.findFirst({
      where: {
        slug: blogSlug,
      },
      include: {
        author: true,
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const mappedblog = {
      ...blog,
      author: blog.author.username,
    };

    return mappedblog;
  }

  async createBlog(authorId: number, dto: CreateBlogDto): Promise<Blog> {
    const slug = generateSlug(dto.title);
    const header = this.extractHeaderFromContent(dto.content);

    try {
      const blog = await this.prisma.blog.create({
        data: {
          title: dto.title,
          slug,
          content: dto.content,
          header,
          authorId: authorId,
        },
      });
      return blog;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated blog title');
        }
      }
      throw error;
    }
  }

  async updateBlogBySlug(blogSlug: string, dto: UpdateBlogDto): Promise<Blog> {
    const existingBlog = await this.getBlogBySlug(blogSlug);

    const updatedData: UpdateBlogDto = { ...dto };

    try {
      if (dto.title) {
        updatedData.slug = generateSlug(updatedData.title);
      }

      if (dto.content) {
        updatedData.header = this.extractHeaderFromContent(dto.content);
      }

      const blog = await this.prisma.blog.update({
        where: {
          id: existingBlog.id,
        },
        data: updatedData,
      });

      return blog;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated blog title');
        }
      }
      throw error;
    }
  }

  async deleteBlogBySlug(blogSlug: string): Promise<Blog> {
    const existingBlog = await this.getBlogBySlug(blogSlug);

    const Blog = await this.prisma.blog.delete({
      where: {
        id: existingBlog.id,
      },
    });

    return Blog;
  }

  private extractHeaderFromContent(content: string | null): string | null {
    const regex = /<img [^>]*src="([^"]+)"/;
    const firstImage = content.match(regex);

    return firstImage
      ? firstImage[1]
      : this.config.get<string>('DEFAULT_IMAGE');
  }
}
