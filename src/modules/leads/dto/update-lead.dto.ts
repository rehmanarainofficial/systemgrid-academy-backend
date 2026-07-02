import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional()
  @IsIn(['new', 'contacted', 'converted', 'rejected'])
  status?: 'new' | 'contacted' | 'converted' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
