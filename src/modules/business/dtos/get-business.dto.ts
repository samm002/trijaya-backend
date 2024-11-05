import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumberString,
  IsNumber,
} from 'class-validator';

import { BusinessSortBy, OrderBy } from '@common/enums';
import { defaultLimitPageData, defaultPage } from '@common/utils';

export class GetBusinessDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  businessId?: number;

  @IsOptional()
  @IsString()
  dateStart?: string;

  @IsOptional()
  @IsString()
  dateEnd?: string;

  @IsOptional()
  @IsEnum(BusinessSortBy)
  sort?: BusinessSortBy = BusinessSortBy.Id;

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
