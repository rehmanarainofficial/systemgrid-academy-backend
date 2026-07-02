import { IsEmail, IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';

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
}
