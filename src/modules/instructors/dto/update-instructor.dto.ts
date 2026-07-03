import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateInstructorDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(7) phone?: string;
  @IsOptional() @IsString() @MinLength(2) specialization?: string;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @IsOptional() @IsUrl() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
