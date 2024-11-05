import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Public } from '@common/decorators';
import { successResponsePayload } from '@common/utils';
import {
  CreateContactUsDto,
  GetContactUsDto,
  UpdateContactUsDto,
} from '@modules/contact-us/dtos';
import { ContactUsService } from '@modules/contact-us/contact-us.service';

@Controller('contact-us')
export class ContactUsController {
  constructor(private contactUsService: ContactUsService) {}

  @Public()
  @Get()
  async getAllContactUs(@Query() query: GetContactUsDto) {
    const { total, data, newest } =
      await this.contactUsService.getAllContactUs(query);

    return successResponsePayload('Get all contact us', data, total, newest);
  }

  @Public()
  @Get(':id')
  async getContactUsBySlug(@Param('id', ParseIntPipe) id: number) {
    const blog = await this.contactUsService.getContactUsById(id);

    return successResponsePayload(`Get contact us by id ${id}`, blog);
  }

  @Post()
  async createContactUs(@Body() dto: CreateContactUsDto) {
    const contactUs = await this.contactUsService.createContactUs(dto);

    return successResponsePayload('Create contact us', contactUs);
  }

  @Patch(':id')
  async updateContactUsBySlug(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactUsDto,
  ) {
    const contactUs = await this.contactUsService.updateContactUsById(id, dto);

    return successResponsePayload(`Update contact us by id ${id}`, contactUs);
  }

  @Delete(':id')
  async deleteContactUsBySlug(@Param('id', ParseIntPipe) id: number) {
    const contactUs = await this.contactUsService.deleteContactUsById(id);

    return successResponsePayload(`Delete contact us by id ${id}`, contactUs);
  }
}
