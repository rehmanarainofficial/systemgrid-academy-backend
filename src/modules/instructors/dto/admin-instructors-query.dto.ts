import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminInstructorsQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['all', 'active', 'inactive']) status: 'all' | 'active' | 'inactive' = 'all';
  @IsOptional() @IsString() specialization?: string;
}
