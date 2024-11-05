import { Module } from '@nestjs/common';

import { MediaModule } from '@modules/albums/media/media.module';
import { AlbumsController } from '@modules/albums/albums.controller';
import { AlbumsService } from '@modules/albums/albums.service';

@Module({
  controllers: [AlbumsController],
  providers: [AlbumsService],
  imports: [MediaModule],
})
export class AlbumsModule {}
