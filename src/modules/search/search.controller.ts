import { Controller, Get, Query } from '@nestjs/common';

import { Public } from '@common/decorators';
import { ResponsePayload } from '@common/interfaces';
import { Features } from '@common/types';
import { successResponsePayload } from '@common/utils';
import { GetSearchDto } from '@modules/search/dtos';
import { SearchService } from '@modules/search/search.service';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Public()
  @Get()
  async getAllFeature(
    @Query() query: GetSearchDto,
  ): Promise<ResponsePayload<Features[]>> {
    const { total, data, newest } =
      await this.searchService.getAllFeature(query);

    return successResponsePayload('Search features', data, total, newest);
  }
}
