import { IsEnum, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator';

export class UpdateBatchScheduleDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsEnum(['online', 'physical', 'hybrid'])
  mode?: 'online' | 'physical' | 'hybrid';

  @IsOptional()
  @IsUrl({ require_tld: false })
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  location?: string;

  @IsOptional()
  @IsEnum(['upcoming', 'completed', 'cancelled'])
  status?: 'upcoming' | 'completed' | 'cancelled';
}
