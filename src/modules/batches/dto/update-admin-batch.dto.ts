import { ArrayMinSize, IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUrl, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateAdminBatchDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(60) code?: string;
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() instructorId?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsArray() @ArrayMinSize(1) @IsString({ each: true }) classDays?: string[];
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime?: string;
  @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime?: string;
  @IsOptional() @IsIn(['online', 'physical', 'hybrid']) mode?: 'online' | 'physical' | 'hybrid';
  @IsOptional() @IsInt() @Min(1) capacity?: number;
  @IsOptional() @IsUrl({ require_tld: false }) meetingUrl?: string;
  @IsOptional() @IsString() @MaxLength(240) location?: string;
  @IsOptional() @IsString() @MaxLength(500) enrollmentNote?: string;
  @IsOptional() @IsIn(['upcoming', 'active', 'completed', 'cancelled']) status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
}
