import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateBlogPostDto {
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @IsString()
  @MinLength(20)
  @MaxLength(500)
  excerpt: string;

  @IsString()
  @MinLength(100)
  @MaxLength(50000)
  content: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @IsUrl({ require_protocol: true, require_tld: false })
  @MaxLength(1000)
  coverImageUrl?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(70)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(170)
  seoDescription?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @Type(() => Boolean)
  @IsBoolean()
  isPublished: boolean = false;
}
