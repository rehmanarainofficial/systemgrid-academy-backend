import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ReviewSubmissionDto {
  @IsInt() @Min(0) marksObtained: number;
  @IsOptional() @IsString() @MaxLength(3000) feedback?: string;
  @IsIn(['checked', 'rejected']) status: 'checked' | 'rejected';
}
