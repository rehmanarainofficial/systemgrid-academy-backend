import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRecordingDto {
  @IsUUID() courseId: string;
  @IsOptional() @IsUUID() batchId?: string;
  @IsString() @MinLength(2) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsUrl() videoUrl: string;
  @IsOptional() @IsUrl() resourceUrl?: string;
  @IsDateString() recordedDate: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class UpdateRecordingDto {
  @IsOptional() @IsUUID() batchId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsUrl() videoUrl?: string;
  @IsOptional() @IsUrl() resourceUrl?: string;
  @IsOptional() @IsDateString() recordedDate?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class RecordingsQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsUUID() batchId?: string;
  @IsOptional() @IsString() status?: 'all' | 'published' | 'draft';
  page = 1;
  limit = 20;
}
