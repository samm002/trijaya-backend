import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import {
  CreateBusinessDto,
  BusinessHeaderDto,
  ProductHeaderDto,
} from '@modules/business/dtos';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
  @IsString()
  @IsOptional()
  slug?: string;

  @ValidateNested()
  @Type(() => BusinessHeaderDto)
  @IsOptional()
  imageHeader?: BusinessHeaderDto;

  @ValidateNested()
  @Type(() => ProductHeaderDto)
  @IsOptional()
  productHeader?: ProductHeaderDto;
}
