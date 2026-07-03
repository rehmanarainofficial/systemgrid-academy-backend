import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminEnrollmentsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

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
