import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateInvoiceDto {
  @IsOptional() @IsNumber() @Min(1) amount?: number;
  @IsOptional() @IsIn(['paid', 'unpaid', 'cancelled']) status?: 'paid' | 'unpaid' | 'cancelled';
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}
