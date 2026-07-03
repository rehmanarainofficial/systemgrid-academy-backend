import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAttendanceRecordDto {
  @IsIn(['present', 'absent', 'late', 'leave'])
  status: 'present' | 'absent' | 'late' | 'leave';

  @IsOptional()
  @IsString()
  @MaxLength(240)
  remarks?: string;
}
