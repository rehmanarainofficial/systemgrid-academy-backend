import { IsIn } from 'class-validator';

export class UpdateEnrollmentStatusDto {
  @IsIn(['pending', 'active', 'completed', 'cancelled', 'dropped'])
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'dropped';
}
