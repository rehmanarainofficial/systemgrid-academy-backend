import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
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
  @MaxLength(50)
  @Matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/, {
    message: 'Name may contain letters and single spaces only',
  })
  name: string;

  @IsEmail()
  email: string;

  @IsUUID()
  emailVerificationApplicationId: string;

  @IsString()
  @Matches(/^03\d{9}$/, { message: 'Phone must be an 11-digit Pakistan mobile number' })
  phone: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password must include uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  city: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/, {
    message: 'Guardian name may contain letters and single spaces only',
  })
  guardianName: string;

  @IsString()
  @Matches(/^03\d{9}$/, { message: 'Guardian phone must be an 11-digit Pakistan mobile number' })
  guardianPhone: string;

  @IsString()
  @MinLength(3)
  @MaxLength(220)
  address: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  educationLevel: string;

  @IsOptional()
  @IsString()
  courseInterest?: string;

  @IsIn(['online', 'physical'])
  preferredMode: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  preferredTiming: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  preferredDays: string;

  @IsOptional()
  @IsString()
  admissionMessage?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsIn(['male', 'female', 'prefer_not_to_say'])
  gender: string;

  @IsOptional()
  @IsIn(['website', 'referral', 'walk_in', 'social_media', 'admin'])
  source?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['active', 'inactive', 'graduated', 'dropped'])
  status: 'active' | 'inactive' | 'graduated' | 'dropped' = 'active';

  @ValidateNested()
  @Type(() => InitialEnrollmentDto)
  enrollment: InitialEnrollmentDto;

  @IsOptional()
  @IsUUID()
  leadId?: string;
}
