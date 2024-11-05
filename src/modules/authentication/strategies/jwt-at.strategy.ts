import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '@shared/prisma/prisma.service';
import { JwtPayload } from '@common/interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_AT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.admin.findUnique({
      where: {
        id: payload.sub,
        refreshToken: {
          not: null,
        },
      },
    });

    if (!user) throw new UnauthorizedException();

    delete user.password;

    return user;
  }
}
