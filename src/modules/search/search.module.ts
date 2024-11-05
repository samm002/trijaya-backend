import { Module } from '@nestjs/common';

import { SearchService } from '@modules/search/search.service';
import { SearchController } from '@modules/search/search.controller';

@Module({
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
