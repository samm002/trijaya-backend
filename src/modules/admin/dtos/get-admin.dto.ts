import { IsOptional, IsEnum, IsString, IsNumberString } from 'class-validator';

import { AdminSortBy, OrderBy } from '@common/enums';
import { defaultLimitPageData, defaultPage } from '@common/utils';

export class GetAdminDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

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
  @IsEnum(AdminSortBy)
  sort?: AdminSortBy = AdminSortBy.Id;

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
