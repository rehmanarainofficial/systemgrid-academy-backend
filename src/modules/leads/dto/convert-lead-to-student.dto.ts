import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, IsUUID, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class ConvertLeadToStudentDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password must include uppercase, lowercase, number, and special character',
  })
  password?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @IsBoolean()
  createFeePlan?: boolean;

  @IsOptional()
  @IsBoolean()
  specialFeeEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  agreedMonthlyFee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  specialFeeReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialFeeNotes?: string;
}
