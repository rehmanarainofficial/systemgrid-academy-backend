import { IsIn } from 'class-validator';

export class UpdateBatchStatusDto {
  @IsIn(['upcoming', 'active', 'completed', 'cancelled'])
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}
