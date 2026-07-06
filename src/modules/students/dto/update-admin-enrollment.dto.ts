import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class UpdateAdminEnrollmentDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @IsIn(['pending', 'active', 'completed', 'cancelled', 'dropped'])
  status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'dropped';
}
