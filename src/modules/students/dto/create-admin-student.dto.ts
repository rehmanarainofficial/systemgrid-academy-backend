import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class InitialEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsIn(['pending', 'active'])
  status: 'pending' | 'active' = 'active';
}

export class CreateAdminStudentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password must include uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  guardianName?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  educationLevel?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender?: string;

  @IsOptional()
  @IsIn(['website', 'referral', 'walk_in', 'social_media', 'admin'])
  source?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['active', 'inactive', 'graduated', 'dropped'])
  status: 'active' | 'inactive' | 'graduated' | 'dropped' = 'active';

  @IsOptional()
  @ValidateNested()
  @Type(() => InitialEnrollmentDto)
  enrollment?: InitialEnrollmentDto;
}
