import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentNotificationsQueryDto {
  @IsOptional()
  @IsIn(['all', 'unread', 'read'])
  status?: 'all' | 'unread' | 'read';

  @IsOptional()
  @IsIn(['all', 'system', 'info', 'fee', 'class', 'assignment', 'certificate', 'payment'])
  type?: 'all' | 'system' | 'info' | 'fee' | 'class' | 'assignment' | 'certificate' | 'payment';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
