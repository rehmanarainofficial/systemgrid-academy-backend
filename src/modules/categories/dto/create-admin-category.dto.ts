import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAdminCategoryDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsString() @MinLength(2) @MaxLength(120) slug: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder = 0;
  @IsOptional() @IsBoolean() isActive = true;
}
