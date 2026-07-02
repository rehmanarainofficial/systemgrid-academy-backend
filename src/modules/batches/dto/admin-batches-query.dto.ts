import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminBatchesQueryDto {
  @IsOptional() @IsInt() @Min(1) page: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit: number = 10;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsIn(['all', 'upcoming', 'active', 'completed', 'cancelled']) status: 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled' = 'all';
  @IsOptional() @IsIn(['online', 'physical', 'hybrid']) mode?: 'online' | 'physical' | 'hybrid';
}
