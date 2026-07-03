import { IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  paymentId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsIn(['paid', 'unpaid', 'cancelled'])
  status?: 'paid' | 'unpaid' | 'cancelled';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
