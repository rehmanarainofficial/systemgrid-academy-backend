import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminCertificatesQueryDto extends PaginationDto {
  @IsOptional() @IsUUID() studentId?: string;
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsIn(['all', 'issued', 'revoked']) status: 'all' | 'issued' | 'revoked' = 'all';
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
