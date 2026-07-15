import { IsBoolean, IsOptional, IsString, IsUrl, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateInstructorClassRecordingDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  videoUrl?: string;

  @IsOptional()
  @IsString()
  resourceUrl?: string;

  @IsOptional()
  @IsString()
  recordedDate?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
