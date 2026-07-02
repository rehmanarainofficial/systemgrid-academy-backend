import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateStudentProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  guardianName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'prefer_not_to_say'])
  gender?: string;

  @IsOptional()
  @IsIn(['matric', 'intermediate', 'bachelor', 'master', 'other'])
  educationLevel?: string;
}
