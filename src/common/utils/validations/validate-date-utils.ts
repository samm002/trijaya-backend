import { BadRequestException } from '@nestjs/common';

import { DateRange } from '@common/interfaces';
import { generateDateRange } from '../generate-date-range.util';

export const validateAndGenerateDateRange = (
  detail: string,
  startDateString: string,
  endDateString: string,
): DateRange => {
  const { start } = generateDateRange(startDateString);
  const { end } = generateDateRange(endDateString);

  if (start > end) {
    throw new BadRequestException(
      `${detail} start date cannot exceed ${detail} end date.`,
    );
  }

  return { start, end };
};
