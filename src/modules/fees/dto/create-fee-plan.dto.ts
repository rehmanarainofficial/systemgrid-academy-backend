import { IsDateString, IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateFeePlanDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  enrollmentId: string;

  @IsNumber()
  @Min(1)
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount = 0;

  @IsIn(['full', 'monthly', 'custom'])
  installmentType: 'full' | 'monthly' | 'custom';

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
