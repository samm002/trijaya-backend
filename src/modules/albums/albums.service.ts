import {
  convertSizeToBytes,
  generateFileSize,
  generatePagination,
  generateReadableDateTime,
  generateSlug,
  validateAndGenerateDateRange,
} from '@common/utils';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Album, Prisma } from '@prisma/client';

import { PrismaService } from '@shared/prisma/prisma.service';
import { OrderBy } from '@common/enums';
import { AlbumMetadata, GetData } from '@common/interfaces';
import {
  CreateAlbumDto,
  GetAlbumDto,
  UpdateAlbumDto,
} from '@modules/albums/dtos';

@Injectable()
export class AlbumsService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getAllAlbumMetadata(): Promise<AlbumMetadata[]> {
    const album = await this.prisma.album.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return album;
  }

  async getAllAlbum(query: GetAlbumDto): Promise<GetData<Album[]>> {
    const {
      title,
      createdBy,
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
      ...(title && { name: { contains: title, mode: 'insensitive' } }),
      ...(createdBy && {
        creatorId: Number(createdBy),
      }),
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

    const [albums, total, newest] = await this.prisma.$transaction([
      this.prisma.album.findMany({
        where: whereCondition,
        include: {
          creator: true,
          medias: true,
        },
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      this.prisma.album.count({
        where: whereCondition,
      }),
      this.prisma.album.findFirst({
        where: whereCondition,
        orderBy: {
          updatedAt: OrderBy.Desc,
        },
        select: {
          updatedAt: true,
        },
      }),
    ]);

    const mappedAlbums = albums.map((doc) => ({
      ...doc,
      creator: doc.creator.username,
    }));

    const albumsWithTotalSize = mappedAlbums.map((album) => {
      const totalSizeBytes = album.medias.reduce((acc, mediaItem) => {
        return acc + convertSizeToBytes(mediaItem.size); // Convert and sum sizes in bytes
      }, 0);

      return {
        ...album,
        size: generateFileSize(totalSizeBytes), // Format the total size as a string
      };
    });

    return {
      total,
      data: albumsWithTotalSize,
      newest: generateReadableDateTime(newest?.updatedAt),
    };
  }

  async getAlbumBySlug(albumSlug: string): Promise<Album> {
    const album = await this.prisma.album.findUnique({
      where: {
        slug: albumSlug,
      },
      include: {
        medias: true,
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    return album;
  }

  async createAlbum(creatorId: number, dto: CreateAlbumDto): Promise<Album> {
    try {
      const album = await this.prisma.album.create({
        data: {
          name: dto.name,
          slug: generateSlug(dto.name),
          header: this.config.get<string>('DEFAULT_IMAGE'),
          creatorId,
        },
      });

      return album;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated album name');
        }
      }
      throw error;
    }
  }

  async updateAlbum(albumSlug: string, dto: UpdateAlbumDto): Promise<Album> {
    try {
      const existingAlbum = await this.getAlbumBySlug(albumSlug);

      const updatedData: UpdateAlbumDto = { ...dto };

      if (dto.name) {
        updatedData.slug = generateSlug(updatedData.name);
      }

      const album = await this.prisma.album.update({
        where: {
          id: existingAlbum.id,
        },
        data: updatedData,
      });

      return album;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated album name');
        }
      }
      throw error;
    }
  }

  async deleteAlbumBySlug(albumSlug: string): Promise<Album> {
    const existingAlbum = await this.getAlbumBySlug(albumSlug);

    const album = await this.prisma.album.delete({
      where: {
        id: existingAlbum.id,
      },
    });

    return album;
  }
}
