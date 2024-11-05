import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '@prisma/client';
import * as argon from 'argon2';

import { PrismaService } from '@shared/prisma/prisma.service';
import { JwtPayload, JwtTokens } from '@common/interfaces';
import { LoginDto } from '@modules/authentication/dtos';

@Injectable()
export class AuthenticationService {
  constructor(
    private config: ConfigService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(dto: LoginDto): Promise<JwtTokens> {
    const admin = await this.prisma.admin.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (!admin)
      throw new UnauthorizedException(
        `Invalid username, no admin with username : ${dto.username}`,
      );

    const passwordMatches = await argon.verify(admin.password, dto.password);

    if (!passwordMatches) {
      throw new UnauthorizedException(`Password not match`);
    }

    const tokens = await this.signToken(admin.id, admin.username);

    await this.updateRefreshToken(admin.id, tokens.refreshToken);

    return tokens;
  }

  async logout(adminId: number): Promise<Admin> {
    if (typeof adminId != 'number') {
      throw new UnauthorizedException('Invalid or empty admin id');
    }

    const admin = await this.prisma.admin.update({
      where: {
        id: adminId,
      },
      data: {
        refreshToken: null,
      },
    });

    return admin;
  }

  async refreshTokens(
    adminId: number,
    refreshToken: string,
  ): Promise<JwtTokens> {
    const admin = await this.prisma.admin.findUnique({
      where: {
        id: adminId,
      },
    });

    if (!admin)
      throw new NotFoundException(
        `Invalid credential, no admin found with id : ${adminId}`,
      );

    const refreshTokenMatches = await argon.verify(
      admin.refreshToken,
      refreshToken,
    );

    if (!refreshTokenMatches)
      throw new ForbiddenException('Refresh token not matched');

    const tokens = await this.signToken(admin.id, admin.username);

    await this.updateRefreshToken(admin.id, tokens.refreshToken);

    return tokens;
  }

  private async signToken(
    adminId: number,
    username: string,
  ): Promise<JwtTokens> {
    const atSecret = this.config.get<string>('JWT_AT_SECRET');
    const rtSecret = this.config.get<string>('JWT_RT_SECRET');
    const atExpire = this.config.get<string>('JWT_AT_EXPIRE');
    const rtExpire = this.config.get<string>('JWT_RT_EXPIRE');

    const payload: JwtPayload = {
      sub: adminId,
      username,
    };

    const [at, rt] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: atSecret,
        expiresIn: atExpire,
      }),
      this.jwt.signAsync(payload, {
        secret: rtSecret,
        expiresIn: rtExpire,
      }),
    ]);

    return {
      accessToken: at,
      refreshToken: rt,
    };
  }

  private async updateRefreshToken(
    adminId: number,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await argon.hash(refreshToken);
    await this.prisma.admin.update({
      where: {
        id: adminId,
      },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });
  }
}
