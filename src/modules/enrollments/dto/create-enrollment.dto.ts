import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @IsIn(['pending', 'active'])
  status?: 'pending' | 'active';
}
