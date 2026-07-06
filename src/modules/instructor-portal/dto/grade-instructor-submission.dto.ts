import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GradeInstructorSubmissionDto {
  @IsInt() @Min(0) @Max(1000) marksObtained: number;
  @IsOptional() @IsString() @MaxLength(2000) feedback?: string;
}
