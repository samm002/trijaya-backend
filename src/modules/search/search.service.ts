import { Injectable } from '@nestjs/common';

import { PrismaService } from '@shared/prisma/prisma.service';
import { Feature, OrderBy, SearchSortBy } from '@common/enums';
import {
  AlbumFeature,
  BlogFeature,
  BusinessFeature,
  DocumentFeature,
  GetData,
  ProductFeature,
  ProjectFeature,
} from '@common/interfaces';
import { Features } from '@common/types';
import { generateReadableDateTime } from '@common/utils';
import { GetSearchDto } from '@modules/search/dtos';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async getAllFeature(query: GetSearchDto): Promise<GetData<Features[]>> {
    const { name, sort, order } = query;

    const albums = await this.prisma.album.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
      include: {
        creator: {
          select: {
            username: true,
          },
        },
      },
    });

    const blogs = await this.prisma.blog.findMany({
      where: {
        title: { contains: name, mode: 'insensitive' },
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    const documents = await this.prisma.document.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
      },
      include: {
        uploader: {
          select: {
            username: true,
          },
        },
      },
    });

    const business = await this.prisma.business.findMany({
      where: {
        title: { contains: name, mode: 'insensitive' },
      },
    });

    const products = await this.prisma.product.findMany({
      where: {
        title: { contains: name, mode: 'insensitive' },
      },
      include: {
        business: {
          select: {
            title: true,
          },
        },
      },
    });

    const projects = await this.prisma.project.findMany({
      where: {
        title: { contains: name, mode: 'insensitive' },
      },
      include: {
        business: {
          select: {
            title: true,
          },
        },
      },
    });

    const mappedAlbums: AlbumFeature[] = albums.map((album) => ({
      feature: Feature.Album,
      ...album,
      creator: album.creator.username,
    }));

    const mappedBlogs: BlogFeature[] = blogs.map((blog) => ({
      feature: Feature.Blog,
      ...blog,
      author: blog.author.username,
    }));

    const mappedDocuments: DocumentFeature[] = documents.map((document) => ({
      feature: Feature.Document,
      ...document,
      uploader: document.uploader.username,
    }));

    const mappedBusiness: BusinessFeature[] = business.map((business) => ({
      feature: Feature.Business,
      ...business,
    }));

    const mappedProducts: ProductFeature[] = products.map((product) => ({
      feature: Feature.Product,
      ...product,
      business: product.business.title,
    }));

    const mappedProjects: ProjectFeature[] = projects.map((project) => ({
      feature: Feature.Project,
      ...project,
      business: project.business.title,
    }));

    const features: Features[] = [
      ...mappedAlbums,
      ...mappedBlogs,
      ...mappedDocuments,
      ...mappedBusiness,
      ...mappedProducts,
      ...mappedProjects,
    ];

    // sort and order search result
    this.sortAndOrderFeature(features, sort, order);

    // find the newest feature
    const newest = this.findNewestDateFromFeature(features);

    return {
      total: features.length,
      data: features,
      newest: generateReadableDateTime(newest),
    };
  }

  private sortAndOrderFeature(
    features: Features[] | null,
    sort: string,
    order: string,
  ): Features[] | null {
    if (!features) {
      return null;
    }

    return features.sort((a, b) => {
      let comparison = 0;

      if (sort === SearchSortBy.Name) {
        const nameA =
          (a as { name?: string; title?: string }).name ||
          (a as { title?: string }).title;
        const nameB =
          (b as { name?: string; title?: string }).name ||
          (b as { title?: string }).title;
        comparison = nameA.localeCompare(nameB);
      } else {
        const dateA =
          (a as { updatedAt?: Date; uploadedAt?: Date }).updatedAt ||
          (a as { uploadedAt?: Date }).uploadedAt;
        const dateB =
          (b as { updatedAt?: Date; uploadedAt?: Date }).updatedAt ||
          (b as { uploadedAt?: Date }).uploadedAt;

        const timestampA = dateA ? new Date(dateA).getTime() : 0;
        const timestampB = dateB ? new Date(dateB).getTime() : 0;

        comparison = timestampA - timestampB;
      }

      return order === OrderBy.Asc ? comparison : -comparison;
    });
  }

  private findNewestDateFromFeature(features: Features[]): Date | null {
    return features.reduce<Date | null>((latestDate, feature) => {
      const dateToCompare =
        (feature as { updatedAt?: Date; uploadedAt?: Date }).updatedAt ||
        (feature as { uploadedAt?: Date }).uploadedAt;

      if (!latestDate) return dateToCompare;

      return dateToCompare > latestDate ? dateToCompare : latestDate;
    }, null);
  }
}
