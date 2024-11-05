import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { DocumentCategory } from '@common/enums';

export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsString()
  size: string;
}
