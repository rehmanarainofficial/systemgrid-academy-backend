import { IsOptional, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @IsOptional()
  @IsString()
  textAnswer?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;
}
