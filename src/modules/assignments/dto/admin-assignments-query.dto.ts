import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminAssignmentsQueryDto {
  @IsOptional() @IsInt() @Min(1) page: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit: number = 12;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() batchId?: string;
  @IsOptional() @IsIn(['all', 'published', 'draft']) status: 'all' | 'published' | 'draft' = 'all';
}
