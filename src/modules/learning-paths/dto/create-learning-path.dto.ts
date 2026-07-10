import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LearningPathPhaseDto {
  @IsString()
  @MaxLength(160)
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  topics: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class LearningPathOutcomeDto {
  @IsString()
  @MaxLength(220)
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateLearningPathDto {
  @IsString()
  @MaxLength(180)
  slug: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  badge?: string;

  @IsString()
  @MaxLength(80)
  level: string;

  @IsString()
  @MaxLength(80)
  duration: string;

  @IsString()
  @MaxLength(200)
  bestFor: string;

  @IsString()
  summary: string;

  @IsString()
  description: string;

  @IsString()
  guidance: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  iconKey?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedSlugs?: string[];

  @IsOptional()
  @IsUUID()
  primaryCourseId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LearningPathPhaseDto)
  phases?: LearningPathPhaseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LearningPathOutcomeDto)
  outcomes?: LearningPathOutcomeDto[];
}
