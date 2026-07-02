import { ArrayMinSize, IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAdminBatchDto {
  @IsString() @MinLength(2) @MaxLength(160) title: string;
  @IsString() @MinLength(2) @MaxLength(60) code: string;
  @IsString() courseId: string;
  @IsOptional() @IsString() instructorId?: string;
  @IsDateString() startDate: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) classDays: string[];
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime: string;
  @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime: string;
  @IsIn(['online', 'physical', 'hybrid']) mode: 'online' | 'physical' | 'hybrid';
  @IsInt() @Min(1) capacity: number;
  @IsIn(['upcoming', 'active', 'completed', 'cancelled']) status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}
