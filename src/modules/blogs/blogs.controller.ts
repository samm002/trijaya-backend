import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Blog } from '@prisma/client';

import { GetUser, Public } from '@common/decorators';
import { JwtGuard } from '@common/guards';
import { ResponsePayload } from '@common/interfaces';
import { successResponsePayload } from '@common/utils';
import { CreateBlogDto, GetBlogDto, UpdateBlogDto } from '@modules/blogs/dtos';
import { BlogsService } from '@modules/blogs/blogs.service';

@UseGuards(JwtGuard)
@Controller('blogs')
export class BlogsController {
  constructor(private blogservice: BlogsService) {}

  @Public()
  @Get()
  async getAllBlog(
    @Query() query: GetBlogDto,
  ): Promise<ResponsePayload<Blog[]>> {
    const { total, data, newest } = await this.blogservice.getAllBlog(query);

    return successResponsePayload('Get all blog', data, total, newest);
  }

  @Public()
  @Get(':blogSlug')
  async getBlogBySlug(
    @Param('blogSlug') blogSlug: string,
  ): Promise<ResponsePayload<Blog>> {
    const blog = await this.blogservice.getBlogBySlug(blogSlug);

    return successResponsePayload(`Get blog by slug ${blogSlug}`, blog);
  }

  @Post()
  async createBlog(
    @GetUser('id') authorId: number,
    @Body() dto: CreateBlogDto,
  ): Promise<ResponsePayload<Blog>> {
    const blog = await this.blogservice.createBlog(authorId, dto);

    return successResponsePayload('Create blog', blog);
  }

  @Patch(':blogSlug')
  async updateBlogBySlug(
    @Param('blogSlug') blogSlug: string,
    @Body() dto: UpdateBlogDto,
  ): Promise<ResponsePayload<Blog>> {
    const blog = await this.blogservice.updateBlogBySlug(blogSlug, dto);

    return successResponsePayload(`Update blog by slug ${blogSlug}`, blog);
  }

  @Delete(':blogSlug')
  async deleteBlogBySlug(
    @Param('blogSlug') blogSlug: string,
  ): Promise<ResponsePayload<Blog>> {
    const blog = await this.blogservice.deleteBlogBySlug(blogSlug);

    return successResponsePayload(`Delete blog by slug ${blogSlug}`, blog);
  }
}
