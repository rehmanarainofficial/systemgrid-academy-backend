import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const STATUSES = ['present', 'absent', 'late', 'leave'] as const;

export class InstructorAttendanceRecordDto {
  @IsUUID() studentId: string;
  @IsIn(STATUSES) status: (typeof STATUSES)[number];
  @IsOptional() @IsString() @MaxLength(255) remarks?: string;
}

export class MarkInstructorAttendanceDto {
  @IsDateString() date: string;
  @IsOptional() @IsUUID() classScheduleId?: string;
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InstructorAttendanceRecordDto)
  records: InstructorAttendanceRecordDto[];
}
