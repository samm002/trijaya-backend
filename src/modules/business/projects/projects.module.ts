import { Module } from '@nestjs/common';

import { ProjectsController } from '@modules/business/projects/projects.controller';
import { ProjectsService } from '@modules/business/projects/projects.service';

@Module({
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
