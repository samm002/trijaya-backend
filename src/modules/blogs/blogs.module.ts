import { Module } from '@nestjs/common';

import { BlogsController } from '@modules/blogs/blogs.controller';
import { BlogsService } from '@modules/blogs/blogs.service';

@Module({
  controllers: [BlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
