import { IsBoolean, IsOptional, IsString, IsUrl, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateInstructorClassRecordingDto {
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsUrl({ require_tld: false })
  videoUrl: string;

  @IsOptional()
  @IsString()
  resourceUrl?: string;

  @IsString()
  recordedDate: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
