import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateAdminAssignmentDto {
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsUUID() batchId?: string;
  @IsOptional() @IsUUID() moduleId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(5000) description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsInt() @Min(1) totalMarks?: number;
  @IsOptional() @IsUrl({ require_tld: false }) attachmentUrl?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
