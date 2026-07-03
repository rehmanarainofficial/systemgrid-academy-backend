import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminSubmissionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @IsOptional()
  @IsIn(['all', 'submitted', 'checked', 'late', 'rejected'])
  status: 'all' | 'submitted' | 'checked' | 'late' | 'rejected' = 'all';
}
