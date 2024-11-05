import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ProjectHeaderDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class ProjectMediaDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  businessId: number;

  @ValidateNested()
  @Type(() => ProjectHeaderDto)
  @IsOptional()
  header?: ProjectHeaderDto;

  @ValidateNested()
  @Type(() => ProjectMediaDto)
  @IsOptional()
  media?: ProjectMediaDto[];
}
