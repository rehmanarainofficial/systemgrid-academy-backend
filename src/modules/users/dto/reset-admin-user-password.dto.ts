import { IsString, MinLength } from 'class-validator';

export class ResetAdminUserPasswordDto {
  @IsString()
  @MinLength(8)
  password: string;
}
