import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateInstructorDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @MinLength(7) phone: string;
  @IsString() @MinLength(2) specialization: string;
  @IsOptional() @IsString() @MaxLength(2000) bio?: string;
  @IsOptional() @IsUrl() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  // When provided together with an email, a login account (role=instructor)
  // is created/linked so the instructor can access the instructor portal.
  @IsOptional() @IsString() @MinLength(8) @MaxLength(72) password?: string;
}
