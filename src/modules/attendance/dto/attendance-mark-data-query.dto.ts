import { IsDateString, IsUUID } from 'class-validator';

export class AttendanceMarkDataQueryDto {
  @IsUUID()
  batchId: string;

  @IsDateString()
  date: string;
}
