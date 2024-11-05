import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Media, Prisma } from '@prisma/client';

import { PrismaService } from '@shared/prisma/prisma.service';
import { OrderBy } from '@common/enums';
import { GetData } from '@common/interfaces';
import {
  convertSizeToBytes,
  generateFileSize,
  generatePagination,
  generateReadableDateTime,
  generateSlug,
  validateAndGenerateDateRange,
} from '@common/utils';
import {
  CreateMediaDto,
  GetMediaDto,
  UpdateMediaDto,
} from '@modules/albums/media/dtos';

@Injectable()
export class MediaService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getAllMedia(query: GetMediaDto): Promise<GetData<Media[]>> {
    const {
      title,
      album,
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
        'Updated',
        dateStart,
        dateEnd,
      );

      dateStarted = start;
      dateEnded = end;
    }

    // let albumData;
    // if (album) {
    //   albumData = await this.prisma.album.findUnique({
    //     id: {
    //       slug: album,
    //     },
    //   });
    // }

    const whereCondition: any = {
      ...(title && { name: { contains: title, mode: 'insensitive' } }),
      ...(uploadedBy && {
        uploaderId: Number(uploadedBy),
      }),
      ...(album && { albumId: Number(album) }),
      ...(dateStart &&
        dateEnd && {
          uploadedAt: {
            gte: dateStarted,
            lt: dateEnded,
          },
        }),
    };

    const [media, total, newest] = await this.prisma.$transaction([
      this.prisma.media.findMany({
        where: whereCondition,
        include: {
          uploader: {
            select: {
              username: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      this.prisma.media.count({
        where: whereCondition,
      }),
      this.prisma.media.findFirst({
        where: whereCondition,
        orderBy: {
          uploadedAt: OrderBy.Desc,
        },
        select: {
          uploadedAt: true,
        },
      }),
    ]);

    return {
      total,
      data: media,
      newest: generateReadableDateTime(newest?.uploadedAt),
    };
  }

  async getMediaBySlug(mediaSlug: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({
      where: {
        slug: mediaSlug,
      },
      include: {
        uploader: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    return media;
  }

  async createMedia(
    uploaderId: number,
    albumSlug: string,
    dtos: CreateMediaDto[] | CreateMediaDto,
  ): Promise<Prisma.BatchPayload | Media> {
    const album = await this.prisma.album.findUnique({
      where: {
        slug: albumSlug,
      },
      select: {
        id: true,
        size: true,
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    const albumSize = album.size !== null ? convertSizeToBytes(album.size) : 0;
    let updatedAlbumSize = 0;

    try {
      if (!Array.isArray(dtos)) {
        const [name, slug] = await this.generateMediaName(dtos.name);
        const media = await this.prisma.media.create({
          data: {
            name,
            slug,
            url: dtos.url,
            size: dtos.size,
            albumId: album.id,
            uploaderId,
          },
        });

        updatedAlbumSize += albumSize + convertSizeToBytes(media.size);

        await this.prisma.album.update({
          where: {
            id: album.id,
          },
          data: {
            header: media.url,
            size: generateFileSize(updatedAlbumSize),
          },
        });

        await this.prisma.album.update({
          where: {
            id: album.id,
          },
          data: {
            size: generateFileSize(updatedAlbumSize),
          },
        });

        return media;
      }

      const mediaData = await Promise.all(
        dtos.map(async (dto) => {
          const [name, slug] = await this.generateMediaName(dto.name);
          return {
            name,
            slug,
            url: dto.url,
            size: dto.size,
            albumId: album.id,
            uploaderId,
          };
        }),
      );

      const media = await this.prisma.$transaction(async (prisma) => {
        return await prisma.media.createMany({
          data: mediaData,
          skipDuplicates: true,
        });
      });

      // Calculate total size of uploaded media
      const totalMediaSize = mediaData.reduce((total, dto) => {
        return total + convertSizeToBytes(dto.size);
      }, 0);

      updatedAlbumSize += albumSize + totalMediaSize;

      const latestMedia = mediaData[mediaData.length - 1];

      await this.prisma.album.update({
        where: {
          id: album.id,
        },
        data: {
          header: latestMedia.url,
          size: generateFileSize(updatedAlbumSize),
        },
      });

      if (media.count === 0) {
        throw new BadRequestException(
          'No media inserted, Duplicated media title',
        );
      }

      return media;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated media title');
        }
      }
      throw error;
    }
  }

  async updateMediaBySlug(
    uploaderId: number,
    albumSlug: string,
    mediaSlug: string,
    dto: UpdateMediaDto,
  ) {
    try {
      const album = await this.prisma.album.findUnique({
        where: {
          slug: albumSlug,
        },
        select: {
          id: true,
        },
      });

      if (!album) {
        throw new NotFoundException('Album not found');
      }

      const existingMedia = await this.getMediaBySlug(mediaSlug);

      const updatedData: UpdateMediaDto = { ...dto };
      updatedData.uploaderId = uploaderId;

      if (dto.name && dto.name !== existingMedia.name) {
        [updatedData.name, updatedData.slug] = await this.generateMediaName(
          dto.name,
        );
      }

      const media = await this.prisma.media.update({
        where: {
          id: existingMedia.id,
        },
        data: updatedData,
      });

      return media;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicated media title');
        }
      }
      throw error;
    }
  }

  async deleteMediaBySlug(mediaSlug: string): Promise<Media> {
    let updatedAlbumHeader: string;

    const existingMedia = await this.getMediaBySlug(mediaSlug);

    const media = await this.prisma.media.delete({
      where: {
        id: existingMedia.id,
      },
    });

    const album = await this.prisma.album.findUnique({
      where: {
        id: existingMedia.albumId,
      },
      select: {
        id: true,
        size: true,
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    const remainingMedia = await this.prisma.media.findMany({
      where: {
        albumId: album.id,
      },
      orderBy: {
        uploadedAt: OrderBy.Desc,
      },
      select: {
        url: true,
      },
    });

    if (remainingMedia.length < 1) {
      updatedAlbumHeader = this.config.get<string>('DEFAULT_IMAGE');
    } else {
      updatedAlbumHeader = remainingMedia[remainingMedia.length - 1].url;
    }

    const updatedAlbumSize =
      convertSizeToBytes(album.size) - convertSizeToBytes(existingMedia.size);

    await this.prisma.album.update({
      where: {
        id: album.id,
      },
      data: {
        header: updatedAlbumHeader,
        size: generateFileSize(updatedAlbumSize),
      },
    });

    return media;
  }

  private async generateMediaName(name: string): Promise<[string, string]> {
    let duplicateCount = 0;
    let mediaName = name;
    let mediaSlug = generateSlug(name);

    while (await this.prisma.media.findFirst({ where: { name: mediaName } })) {
      duplicateCount++;
      mediaName = `${name}(${duplicateCount})`;
      mediaSlug = generateSlug(name) + `(${duplicateCount})`;
    }

    return [mediaName, mediaSlug];
  }
}
