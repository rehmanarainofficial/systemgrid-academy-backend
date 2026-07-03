import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

class AdminAttendanceRecordDto {
  @IsUUID()
  studentId: string;

  @IsIn(['present', 'absent', 'late', 'leave'])
  status: 'present' | 'absent' | 'late' | 'leave';

  @IsOptional()
  @IsString()
  @MaxLength(240)
  remarks?: string;
}

export class MarkAdminAttendanceDto {
  @IsUUID()
  batchId: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  classScheduleId?: string;

  @IsDateString()
  date: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdminAttendanceRecordDto)
  records: AdminAttendanceRecordDto[];
}
