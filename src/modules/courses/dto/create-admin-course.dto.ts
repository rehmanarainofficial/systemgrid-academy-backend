import {
  IsBoolean,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminCourseModuleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class CreateAdminCourseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  slug?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(300)
  shortDescription: string;

  @IsString()
  @MinLength(20)
  description: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  techStack?: string[];

  @IsString()
  categoryId: string;

  @IsIn(['beginner', 'intermediate', 'advanced'])
  level: 'beginner' | 'intermediate' | 'advanced';

  @IsInt()
  @Min(1)
  duration: number;

  @IsIn(['weeks', 'months'])
  durationUnit: 'weeks' | 'months';

  @IsIn(['online', 'physical', 'hybrid'])
  mode: 'online' | 'physical' | 'hybrid';

  @IsIn(['english', 'urdu', 'roman_urdu', 'mixed'])
  language: 'english' | 'urdu' | 'roman_urdu' | 'mixed';

  @IsNumber()
  @Min(0)
  fee: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountFee?: number;

  @IsBoolean()
  isFeatured: boolean;

  @IsBoolean()
  isPublished: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdminCourseModuleDto)
  modules?: AdminCourseModuleDto[];
}
