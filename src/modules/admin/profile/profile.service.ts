import { Injectable } from '@nestjs/common';
import { Admin } from '@prisma/client';
import * as argon from 'argon2';

import { PrismaService } from '@shared/prisma/prisma.service';
import { UpdateAdminDto } from '@modules/admin/dtos';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(adminId: number): Promise<Admin> {
    const profile = await this.prisma.admin.findUnique({
      where: {
        id: adminId,
      },
      include: {
        blogs: {
          select: {
            title: true,
          },
        },
        documents: {
          select: {
            name: true,
          },
        },
        medias: {
          select: {
            name: true,
          },
        },
      },
    });

    return profile;
  }
  async updateProfile(adminId: number, dto: UpdateAdminDto): Promise<Admin> {
    const updatedData: UpdateAdminDto = { ...dto };

    if (dto.password) {
      updatedData.password = await argon.hash(dto.password);
    }

    const profile = await this.prisma.admin.update({
      where: {
        id: adminId,
      },
      data: updatedData,
    });

    return profile;
  }
}
