import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SubmitStudentFeePaymentDto {
  @IsUUID()
  feePlanId: string;

  @IsIn(['bank_transfer', 'easypaisa', 'jazzcash', 'card'])
  method: 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'card';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  transactionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  senderNumber?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  useWalletCredit?: boolean;
}
