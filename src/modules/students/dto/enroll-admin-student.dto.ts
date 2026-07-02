import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class EnrollAdminStudentDto {
  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @IsIn(['pending', 'active'])
  status: 'pending' | 'active' = 'active';
}
