import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AdminLeadsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['all', 'new', 'contacted', 'converted', 'rejected'])
  status: 'all' | 'new' | 'contacted' | 'converted' | 'rejected' = 'all';

  @IsOptional()
  @IsString()
  source: string = 'all';

  @IsOptional()
  @IsString()
  courseInterest?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
