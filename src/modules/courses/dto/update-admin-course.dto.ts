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
import { AdminCourseModuleDto } from './create-admin-course.dto';

export class UpdateAdminCourseDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) slug?: string;
  @IsOptional() @IsString() @MinLength(10) @MaxLength(300) shortDescription?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUrl({ require_tld: false }) thumbnail?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) @MaxLength(40, { each: true }) techStack?: string[];
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsIn(['beginner', 'intermediate', 'advanced']) level?: 'beginner' | 'intermediate' | 'advanced';
  @IsOptional() @IsInt() @Min(1) duration?: number;
  @IsOptional() @IsIn(['weeks', 'months']) durationUnit?: 'weeks' | 'months';
  @IsOptional() @IsIn(['online', 'physical', 'hybrid']) mode?: 'online' | 'physical' | 'hybrid';
  @IsOptional() @IsIn(['english', 'urdu', 'roman_urdu', 'mixed']) language?: 'english' | 'urdu' | 'roman_urdu' | 'mixed';
  @IsOptional() @IsNumber() @Min(0) fee?: number;
  @IsOptional() @IsNumber() @Min(0) discountFee?: number;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => AdminCourseModuleDto) modules?: AdminCourseModuleDto[];
}
