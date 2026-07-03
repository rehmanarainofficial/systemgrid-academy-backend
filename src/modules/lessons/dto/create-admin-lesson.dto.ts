import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAdminLessonDto {
  @IsUUID() courseId: string;
  @IsUUID() moduleId: string;
  @IsString() @MinLength(2) @MaxLength(180) title: string;
  @IsOptional() @IsString() @MaxLength(3000) description?: string;
  @IsOptional() @IsUrl({ require_tld: false }) videoUrl?: string;
  @IsOptional() @IsUrl({ require_tld: false }) resourceUrl?: string;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsInt() @Min(0) sortOrder: number;
  @IsBoolean() isPreview: boolean;
  @IsBoolean() isPublished: boolean;
}
