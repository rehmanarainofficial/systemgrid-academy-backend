import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsIn(['cash', 'bank_transfer', 'easypaisa', 'jazzcash', 'card'])
  method?: 'cash' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'card';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  transactionId?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsIn(['pending', 'verified', 'rejected'])
  status?: 'pending' | 'verified' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
