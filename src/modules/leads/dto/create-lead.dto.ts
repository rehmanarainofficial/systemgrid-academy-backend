import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  courseInterest?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  guardianName?: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  guardianPhone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'prefer_not_to_say'])
  gender?: 'male' | 'female' | 'prefer_not_to_say';

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  educationLevel?: string;

  @IsOptional()
  @IsString()
  @IsIn(['online', 'physical', 'hybrid'])
  preferredMode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  preferredTiming?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  preferredDays?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  selectedCourse?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'website',
    'demo_class',
    'admissions',
    'admissions_page',
    'contact',
    'course_detail_page',
  ])
  source?: string;
}
