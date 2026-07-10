import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

export class UpdateInstructorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(namePattern, {
    message: 'Name may contain letters and single spaces only',
  })
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^03\d{9}$/, {
    message: 'Phone must be an 11-digit Pakistan mobile number',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  specialization?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
