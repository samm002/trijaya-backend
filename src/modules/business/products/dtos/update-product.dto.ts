import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import {
  CreateProductDto,
  ProductMediaDto,
} from '@modules/business/products/dtos';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsString()
  @IsOptional()
  slug?: string;

  @ValidateNested()
  @Type(() => ProductMediaDto)
  @IsOptional()
  media?: ProductMediaDto[];
}
