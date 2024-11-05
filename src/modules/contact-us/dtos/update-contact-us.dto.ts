import { PartialType } from '@nestjs/mapped-types';

import { CreateContactUsDto } from '@modules/contact-us/dtos';
import { IsOptional, IsString } from 'class-validator';

export class UpdateContactUsDto extends PartialType(CreateContactUsDto) {
  @IsString()
  @IsOptional()
  fullName?: string;
}
