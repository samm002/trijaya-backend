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

import { GetUser, Public } from '@common/decorators';
import { JwtGuard } from '@common/guards';
import { AlbumMetadata, ResponsePayload } from '@common/interfaces';
import { successResponsePayload } from '@common/utils';
import {
  CreateAlbumDto,
  GetAlbumDto,
  UpdateAlbumDto,
} from '@modules/albums/dtos';
import { AlbumsService } from '@modules/albums/albums.service';

@UseGuards(JwtGuard)
@Controller('albums')
export class AlbumsController {
  constructor(private albumService: AlbumsService) {}

  @Public()
  @Get('metadata')
  async getAllAlbumMetadata(): Promise<ResponsePayload<AlbumMetadata[]>> {
    const album = await this.albumService.getAllAlbumMetadata();

    return successResponsePayload('Get all album metadata', album);
  }

  @Public()
  @Get()
  async getAllMedia(@Query() query: GetAlbumDto) {
    const { total, data, newest } = await this.albumService.getAllAlbum(query);

    return successResponsePayload('Get all album', data, total, newest);
  }

  @Public()
  @Get(':albumSlug')
  async getMediaBySlug(@Param('albumSlug') albumSlug: string) {
    const album = await this.albumService.getAlbumBySlug(albumSlug);

    return successResponsePayload(`Get album by slug ${albumSlug}`, album);
  }

  @Post()
  async createMedia(
    @GetUser('id') uploaderId: number,
    @Body() dto: CreateAlbumDto,
  ) {
    const album = await this.albumService.createAlbum(uploaderId, dto);

    return successResponsePayload('Create album', album);
  }

  @Patch(':albumSlug')
  async updateMediaBySlug(
    @Param('albumSlug') albumSlug: string,
    @Body() dto: UpdateAlbumDto,
  ) {
    const album = await this.albumService.updateAlbum(albumSlug, dto);

    return successResponsePayload(`Update album by slug ${albumSlug}`, album);
  }

  @Delete(':albumSlug')
  async deleteAlbumBySlug(@Param('albumSlug') albumSlug: string) {
    const album = await this.albumService.deleteAlbumBySlug(albumSlug);

    return successResponsePayload(`Delete album by slug ${albumSlug}`, album);
  }
}
