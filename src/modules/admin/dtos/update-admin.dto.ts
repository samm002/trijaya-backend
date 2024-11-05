import { PartialType } from '@nestjs/mapped-types';

import { CreateAdminDto } from '@modules/admin/dtos';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
