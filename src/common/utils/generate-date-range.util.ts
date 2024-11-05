import { BadRequestException } from '@nestjs/common';

import { DateRange } from '@common/interfaces';

export const generateDateRange = (dateString: string): DateRange | null => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new BadRequestException(
      "Invalid date format, please input with format 'yyyy-mm-dd'",
    );
  }

  return {
    start: new Date(date.setUTCHours(0, 0, 0, 0)),
    end: new Date(date.setUTCHours(23, 59, 59, 999)),
  };
};
