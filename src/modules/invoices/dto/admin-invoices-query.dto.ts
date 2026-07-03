import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminInvoicesQueryDto extends PaginationDto {
  @IsOptional() @IsUUID() studentId?: string;
  @IsOptional() @IsIn(['all', 'paid', 'unpaid', 'cancelled']) status: 'all' | 'paid' | 'unpaid' | 'cancelled' = 'all';
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
