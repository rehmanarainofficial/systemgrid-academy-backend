import { IsDateString, IsIn, IsOptional, IsString, IsUrl, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateBatchScheduleDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime: string;

  @IsIn(['online', 'physical', 'hybrid'])
  mode: 'online' | 'physical' | 'hybrid';

  @IsOptional()
  @IsUrl({ require_tld: false })
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  location?: string;

  @IsOptional()
  @IsIn(['upcoming', 'completed', 'cancelled'])
  status?: 'upcoming' | 'completed' | 'cancelled';
}
