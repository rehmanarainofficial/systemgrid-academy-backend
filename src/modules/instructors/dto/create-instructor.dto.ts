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
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export class CreateInstructorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(namePattern, {
    message: 'Name may contain letters and single spaces only',
  })
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^03\d{9}$/, {
    message: 'Phone must be an 11-digit Pakistan mobile number',
  })
  phone: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  specialization: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  bio: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(passwordPattern, {
    message:
      'Password must include uppercase, lowercase, number, and special character',
  })
  password: string;
}
