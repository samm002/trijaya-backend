import { IsEnum, IsOptional, IsString } from 'class-validator';

import { OrderBy, SearchSortBy } from '@common/enums';

export class GetSearchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SearchSortBy)
  sort?: SearchSortBy = SearchSortBy.Name;

  @IsOptional()
  @IsEnum(OrderBy)
  order?: OrderBy = OrderBy.Asc;
}
