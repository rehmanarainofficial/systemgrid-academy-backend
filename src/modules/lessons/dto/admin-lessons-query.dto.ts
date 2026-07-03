import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminLessonsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 12;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() moduleId?: string;
  @IsOptional() @IsIn(['all', 'published', 'draft']) status: 'all' | 'published' | 'draft' = 'all';
  @IsOptional() @IsIn(['all', 'preview', 'normal']) preview: 'all' | 'preview' | 'normal' = 'all';
}
