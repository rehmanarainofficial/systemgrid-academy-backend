import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminPaymentsQueryDto extends PaginationDto {
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
  @IsIn(['all', 'cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'card'])
  method: 'all' | 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'card' = 'all';

  @IsOptional()
  @IsIn(['all', 'pending', 'verified', 'rejected'])
  status: 'all' | 'pending' | 'verified' | 'rejected' = 'all';

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
