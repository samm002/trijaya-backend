import { Module } from '@nestjs/common';

import { MediaController } from '@modules/albums/media/media.controller';
import { MediaService } from '@modules/albums/media/media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
