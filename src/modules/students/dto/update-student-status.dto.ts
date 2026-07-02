import { IsIn } from 'class-validator';

export class UpdateStudentStatusDto {
  @IsIn(['active', 'inactive', 'graduated', 'dropped'])
  status: 'active' | 'inactive' | 'graduated' | 'dropped';
}
