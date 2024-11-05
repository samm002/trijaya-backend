import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import {
  CreateProjectDto,
  ProjectMediaDto,
} from '@modules/business/projects/dtos';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsString()
  @IsOptional()
  slug?: string;

  @ValidateNested()
  @Type(() => ProjectMediaDto)
  @IsOptional()
  media?: ProjectMediaDto[];
}
