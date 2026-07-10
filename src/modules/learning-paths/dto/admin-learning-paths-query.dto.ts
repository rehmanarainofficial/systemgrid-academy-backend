import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class AdminLearningPathsQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['all', 'published', 'draft'])
  status?: 'all' | 'published' | 'draft';
}
