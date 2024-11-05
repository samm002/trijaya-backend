import { Module } from '@nestjs/common';

import { ProfileModule } from '@modules/admin/profile/profile.module';
import { AdminController } from '@modules/admin/admin.controller';
import { AdminService } from '@modules/admin/admin.service';

@Module({
  providers: [AdminService],
  controllers: [AdminController],
  imports: [ProfileModule],
})
export class AdminModule {}
