import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateInstructorAssignmentDto {
  @IsUUID() batchId: string;
  @IsString() @MinLength(2) @MaxLength(200) title: string;
  @IsString() @MinLength(2) @MaxLength(4000) description: string;
  @IsDateString() dueDate: string;
  @IsInt() @Min(1) @Max(1000) totalMarks: number;
  @IsOptional() @IsUUID() moduleId?: string;
  @IsOptional() @IsUrl() attachmentUrl?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
