import { IsOptional, IsEnum, IsString, IsNumberString } from 'class-validator';

import { BlogSortBy, OrderBy } from '@common/enums';
import { defaultLimitPageData, defaultPage } from '@common/utils';

export class GetBlogDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  dateCreateStart?: string;

  @IsOptional()
  @IsString()
  dateCreateEnd?: string;

  @IsOptional()
  @IsString()
  dateUpdateStart?: string;

  @IsOptional()
  @IsString()
  dateUpdateEnd?: string;

  @IsOptional()
  @IsNumberString()
  author?: string;

  @IsOptional()
  @IsEnum(BlogSortBy)
  sort?: BlogSortBy = BlogSortBy.Id;

  @IsOptional()
  @IsEnum(OrderBy)
  order?: OrderBy = OrderBy.Asc;

  @IsOptional()
  @IsNumberString()
  page?: string = defaultPage;

  @IsOptional()
  @IsNumberString()
  limit?: string = defaultLimitPageData;
}
