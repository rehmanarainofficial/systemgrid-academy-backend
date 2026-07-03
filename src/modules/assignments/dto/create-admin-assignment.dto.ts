import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAdminAssignmentDto {
  @IsUUID() courseId: string;
  @IsUUID() batchId: string;
  @IsOptional() @IsUUID() moduleId?: string;
  @IsString() @MinLength(2) @MaxLength(180) title: string;
  @IsString() @MinLength(10) @MaxLength(5000) description: string;
  @IsDateString() dueDate: string;
  @IsInt() @Min(1) totalMarks: number;
  @IsOptional() @IsUrl({ require_tld: false }) attachmentUrl?: string;
  @IsBoolean() isPublished: boolean;
}
