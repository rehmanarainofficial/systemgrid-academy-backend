import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  feePlanId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsIn(['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'card'])
  method: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'card';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  transactionId?: string;

  @IsDateString()
  paymentDate: string;

  @IsIn(['pending', 'verified', 'rejected'])
  status: 'pending' | 'verified' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
