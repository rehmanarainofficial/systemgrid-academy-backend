import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  specialFeeEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  agreedMonthlyFee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  specialFeeReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialFeeNotes?: string;
}
