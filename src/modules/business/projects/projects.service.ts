import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';

import { PrismaService } from '@shared/prisma/prisma.service';
import { OrderBy } from '@common/enums';
import { GetData, Header, MediaData } from '@common/interfaces';
import {
  generateDefaultHeader,
  generatePagination,
  generateReadableDateTime,
  generateSlug,
  validateAndGenerateDateRange,
} from '@common/utils';
import {
  CreateProjectDto,
  GetProjectDto,
  UpdateProjectDto,
} from '@modules/business/projects/dtos';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async getAllProject(query: GetProjectDto): Promise<GetData<Project[]>> {
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
          `Project not found with business slug '${business}'`,
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

    const [projects, total, newest] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: whereCondition,
        include: {
          business: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      this.prisma.project.count({
        where: whereCondition,
      }),
      this.prisma.project.findFirst({
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
      data: projects,
      newest: generateReadableDateTime(newest?.updatedAt),
    };
  }

  async getProjectBySlug(projectSlug: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: {
        slug: projectSlug,
      },
      include: {
        business: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async createProject(dto: CreateProjectDto): Promise<Project> {
    const slug = generateSlug(dto.title);

    try {
      if (dto.media) {
        dto.media = await this.validateProjectMedia(null, dto.media);
      }

      const header = await this.validateProjectHeader(null, dto.header ?? null);

      const project = await this.prisma.project.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description,
          header:
            (header as unknown as Prisma.InputJsonValue) ??
            generateDefaultHeader(slug, null),
          media: dto.media as unknown as Prisma.InputJsonValue[],
          businessId: dto.businessId,
        },
      });

      return project;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated project title');
        }
      }
      throw error;
    }
  }

  async updateProjectBySlug(projectslug: string, dto: UpdateProjectDto) {
    const existingProject = await this.getProjectBySlug(projectslug);

    const updatedData: UpdateProjectDto = { ...dto };

    try {
      let header: { slug: string; url: string } | null;

      if (dto.title) {
        updatedData.slug = generateSlug(updatedData.title);
      }

      if (dto.header) {
        header = await this.validateProjectHeader(
          existingProject.id,
          dto.header ?? null,
        );
      }

      if (dto.media) {
        dto.media = await this.validateProjectMedia(
          existingProject.id,
          dto.media,
        );
      }

      const project = await this.prisma.project.update({
        where: {
          id: existingProject.id,
        },
        data: {
          ...updatedData,
          header: header
            ? (header as unknown as Prisma.InputJsonValue)
            : existingProject.header,
          media: updatedData.media as unknown as Prisma.InputJsonValue[],
        },
      });

      return project;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated project title');
        }
      }
      throw error;
    }
  }

  async deleteProjectBySlug(projectslug: string): Promise<Project> {
    const existingProject = await this.getProjectBySlug(projectslug);

    const project = await this.prisma.project.delete({
      where: {
        id: existingProject.id,
      },
    });

    return project;
  }

  private async validateProjectHeader(
    projectId: number | null,
    header: Header | null,
  ): Promise<{ slug: string; url: string }> {
    if (header) {
      const duplicatedHeader = await this.prisma.project.findFirst({
        where: {
          header: {
            path: ['slug'],
            string_contains: header.slug.toLowerCase(),
          },
          NOT: {
            ...(projectId ? { id: projectId } : {}),
          },
        },
      });

      if (duplicatedHeader) {
        throw new BadRequestException('Duplicated business header');
      }
    }

    return {
      slug: header.slug.toLowerCase(),
      url: header.url,
    };
  }

  async validateProjectMedia(
    projectId: number | null,
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

    const allProducts = await this.prisma.project.findMany({
      where: projectId ? { NOT: { id: projectId } } : {},
      select: {
        id: true,
        media: true,
      },
    });

    for (const newMedia of mediaList) {
      const conflictingProduct = allProducts.find((project) => {
        const projectMedia = project.media as { slug: string; url: string }[];
        return projectMedia.some(
          (existingMedia) => existingMedia.slug.toLowerCase() === newMedia.slug,
        );
      });

      if (conflictingProduct) {
        throw new BadRequestException(`Duplicated project media`);
      }
    }

    return mediaList;
  }
}
