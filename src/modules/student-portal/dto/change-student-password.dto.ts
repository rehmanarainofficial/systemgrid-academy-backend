import { IsString, MinLength } from 'class-validator';

export class ChangeStudentPasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  confirmPassword: string;
}
