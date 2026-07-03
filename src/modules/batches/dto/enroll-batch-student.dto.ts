import { IsIn, IsUUID } from 'class-validator';

export class EnrollBatchStudentDto {
  @IsUUID()
  studentId: string;

  @IsIn(['pending', 'active'])
  status: 'pending' | 'active';
}

export class UpdateBatchEnrollmentStatusDto {
  @IsIn(['pending', 'active', 'completed', 'cancelled', 'dropped'])
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'dropped';
}
