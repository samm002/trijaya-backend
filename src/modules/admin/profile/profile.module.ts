import { Module } from '@nestjs/common';

import { ProfileController } from '@modules/admin/profile/profile.controller';
import { ProfileService } from '@modules/admin/profile/profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
