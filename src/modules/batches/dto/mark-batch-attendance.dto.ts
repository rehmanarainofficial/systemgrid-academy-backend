import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

class AttendanceRecordDto {
  @IsUUID()
  studentId: string;

  @IsIn(['present', 'absent', 'late', 'leave'])
  status: 'present' | 'absent' | 'late' | 'leave';

  @IsOptional()
  @IsString()
  @MaxLength(240)
  remarks?: string;
}

export class MarkBatchAttendanceDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsUUID()
  classScheduleId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
