import { IsString, Matches, MinLength } from 'class-validator';

export class ResetStudentPasswordDto {
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password must include uppercase, lowercase, number, and special character',
  })
  password: string;
}
