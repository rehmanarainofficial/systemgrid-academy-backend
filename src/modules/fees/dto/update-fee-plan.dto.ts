import { IsDateString, IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateFeePlanDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsIn(['full', 'monthly', 'custom'])
  installmentType?: 'full' | 'monthly' | 'custom';

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
