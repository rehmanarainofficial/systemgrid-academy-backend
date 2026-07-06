import {
  IsBoolean,
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

export class CreateInstructorLessonDto {
  @IsUUID() courseId: string;
  @IsString() @MinLength(2) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsUrl() videoUrl?: string;
  @IsOptional() @IsUrl() resourceUrl?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1000) durationMinutes?: number;
  @IsOptional() @IsUUID() moduleId?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
