import { BadRequestException } from '@nestjs/common';

import { Pagination } from '@common/interfaces';

export const generatePagination = (page: string, limit: string): Pagination => {
  if (Number(page) <= 0) {
    throw new BadRequestException("Page must be bigger than '0'");
  }

  return {
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  };
};
