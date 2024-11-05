import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BusinessHeaderDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class ProductHeaderDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @ValidateNested()
  @Type(() => BusinessHeaderDto)
  @IsOptional()
  header?: BusinessHeaderDto;

  @ValidateNested()
  @Type(() => ProductHeaderDto)
  @IsOptional()
  productHeader?: ProductHeaderDto;
}
