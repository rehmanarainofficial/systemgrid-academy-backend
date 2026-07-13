import { BadRequestException } from '@nestjs/common';
import type { Batch } from '../../database/entities';

export function assertAttendanceDateWithinBatch(batch: Pick<Batch, 'startDate' | 'endDate'>, date: string) {
  if (date < batch.startDate) {
    throw new BadRequestException(
      `Attendance cannot be marked before the batch start date (${batch.startDate})`,
    );
  }
  if (batch.endDate && date > batch.endDate) {
    throw new BadRequestException(
      `Attendance cannot be marked after the batch end date (${batch.endDate})`,
    );
  }
}

export function assertScheduleDateWithinBatch(batch: Pick<Batch, 'startDate' | 'endDate'>, date: string) {
  if (date < batch.startDate) {
    throw new BadRequestException(
      `Class schedule cannot be created before the batch start date (${batch.startDate})`,
    );
  }
  if (batch.endDate && date > batch.endDate) {
    throw new BadRequestException(
      `Class schedule cannot be created after the batch end date (${batch.endDate})`,
    );
  }
}
