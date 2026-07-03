import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminNotificationsQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['all', 'system', 'fee', 'class', 'assignment', 'certificate', 'payment']) type: 'all' | 'system' | 'fee' | 'class' | 'assignment' | 'certificate' | 'payment' = 'all';
  @IsOptional() @IsIn(['all', 'all_students', 'course_students', 'batch_students', 'selected_students']) targetType: 'all' | 'all_students' | 'course_students' | 'batch_students' | 'selected_students' = 'all';
  @IsOptional() @IsDateString() dateFrom?: string;
  @IsOptional() @IsDateString() dateTo?: string;
}
