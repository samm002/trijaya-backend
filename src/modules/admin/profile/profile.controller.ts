import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Admin } from '@prisma/client';

import { GetUser } from '@common/decorators';
import { JwtGuard } from '@common/guards';
import { ResponsePayload } from '@common/interfaces';
import { successResponsePayload } from '@common/utils';
import { UpdateAdminDto } from '@modules/admin/dtos';
import { ProfileService } from '@modules/admin/profile/profile.service';

@UseGuards(JwtGuard)
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  async getProfile(
    @GetUser('id', ParseIntPipe) adminId: number,
  ): Promise<ResponsePayload<Admin>> {
    const profile = await this.profileService.getProfile(adminId);

    return successResponsePayload(
      `Get profile by admin id ${adminId}`,
      profile,
    );
  }

  @Patch()
  async updateProfile(
    @GetUser('id', ParseIntPipe) adminId: number,
    @Body() dto: UpdateAdminDto,
  ): Promise<ResponsePayload<Admin>> {
    const profile = await this.profileService.updateProfile(adminId, dto);

    return successResponsePayload(
      `Update profile by admin id ${adminId}`,
      profile,
    );
  }
}
