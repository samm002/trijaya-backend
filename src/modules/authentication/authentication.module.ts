import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { JwtStrategy, RtStrategy } from '@modules/authentication/strategies';
import { AuthenticationController } from '@modules/authentication/authentication.controller';
import { AuthenticationService } from '@modules/authentication/authentication.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_AT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_AT_EXPIRE'),
        },
      }),
    }),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, JwtStrategy, RtStrategy],
})
export class AuthenticationModule {}
