import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactUs } from '@prisma/client';

import { PrismaService } from '@shared/prisma/prisma.service';
import { MailsService } from '@shared/mails/mails.service';
import { OrderBy } from '@common/enums';
import { GetData } from '@common/interfaces';
import {
  capitalizedWord,
  generatePagination,
  generateReadableDateTime,
  validateAndGenerateDateRange,
} from '@common/utils';
import {
  CreateContactUsDto,
  GetContactUsDto,
  UpdateContactUsDto,
} from '@modules/contact-us/dtos';

@Injectable()
export class ContactUsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailsService,
  ) {}

  async getAllContactUs(query: GetContactUsDto): Promise<GetData<ContactUs[]>> {
    const {
      fullName,
      email,
      phoneNumber,
      dateCreateStart,
      dateCreateEnd,
      dateUpdateStart,
      dateUpdateEnd,
      sort,
      order,
      page,
      limit,
    } = query;
    const { skip, take } = generatePagination(page, limit);

    let dateCreatedStart: Date;
    let dateCreatedEnd: Date;
    let dateUpdatedStart: Date;
    let dateUpdatedEnd: Date;

    if (dateCreateStart && dateCreateEnd) {
      const { start, end } = validateAndGenerateDateRange(
        'Created',
        dateCreateStart,
        dateCreateEnd,
      );

      dateCreatedStart = start;
      dateCreatedEnd = end;
    }

    if (dateUpdateStart && dateUpdateEnd) {
      const { start, end } = validateAndGenerateDateRange(
        'Updated',
        dateUpdateStart,
        dateUpdateEnd,
      );

      dateUpdatedStart = start;
      dateUpdatedEnd = end;
    }

    const whereCondition: any = {
      ...(fullName && {
        fullName: { contains: fullName, mode: 'insensitive' },
      }),
      ...(email && { email: { contains: email, mode: 'insensitive' } }),
      ...(phoneNumber && {
        phoneNumber: { contains: phoneNumber, mode: 'insensitive' },
      }),
      ...(dateCreateStart &&
        dateCreateEnd && {
          createdAt: {
            gte: dateCreatedStart,
            lt: dateCreatedEnd,
          },
        }),
      ...(dateUpdateStart &&
        dateUpdateEnd && {
          updatedAt: {
            gte: dateUpdatedStart,
            lt: dateUpdatedEnd,
          },
        }),
    };

    const [contactUs, total, newest] = await this.prisma.$transaction([
      this.prisma.contactUs.findMany({
        where: whereCondition,
        orderBy: { [sort]: order },
        skip,
        take,
      }),
      this.prisma.contactUs.count({
        where: whereCondition,
      }),
      this.prisma.contactUs.findFirst({
        where: whereCondition,
        orderBy: {
          updatedAt: OrderBy.Desc,
        },
        select: {
          updatedAt: true,
        },
      }),
    ]);

    return {
      total,
      data: contactUs,
      newest: generateReadableDateTime(newest?.updatedAt),
    };
  }

  async getContactUsById(contactUsId: number): Promise<ContactUs> {
    const contactUs = await this.prisma.contactUs.findUnique({
      where: {
        id: contactUsId,
      },
    });

    if (!contactUs) {
      throw new NotFoundException('Contact us not found');
    }

    return contactUs;
  }

  async createContactUs(dto: CreateContactUsDto): Promise<ContactUs> {
    const fullName =
      dto.firstName && dto.lastName
        ? `${capitalizedWord(dto.firstName)} ${capitalizedWord(dto.lastName)}`
        : capitalizedWord(dto.firstName) ||
          capitalizedWord(dto.lastName) ||
          'Anonymous';

    const contactUs = await this.prisma.contactUs.create({
      data: {
        fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        message: dto.message,
      },
    });

    await this.mailService.sendContactUsMail(dto, fullName);

    return contactUs;
  }

  async updateContactUsById(
    contactUsId: number,
    dto: UpdateContactUsDto,
  ): Promise<ContactUs> {
    const existingContactUs = await this.getContactUsById(contactUsId);

    const updatedData: UpdateContactUsDto = { ...dto };
    updatedData.fullName = existingContactUs.fullName;

    if (dto.firstName || dto.lastName) {
      updatedData.fullName =
        dto.firstName && dto.lastName
          ? `${capitalizedWord(dto.firstName)} ${capitalizedWord(dto.lastName)}`
          : capitalizedWord(dto.firstName) || capitalizedWord(dto.lastName);

      delete updatedData.firstName;
      delete updatedData.lastName;
    }

    const contactUs = await this.prisma.contactUs.update({
      where: {
        id: existingContactUs.id,
      },
      data: updatedData,
    });

    return contactUs;
  }

  async deleteContactUsById(contactUsId: number): Promise<ContactUs> {
    const existingContactUs = await this.getContactUsById(contactUsId);

    const contactUs = await this.prisma.contactUs.delete({
      where: {
        id: existingContactUs.id,
      },
    });

    return contactUs;
  }
}
