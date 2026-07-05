import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Matches,
} from 'class-validator';
import type { Gender, PaymentGateway, PricingPlanType } from '../../../database/entities';

export class StartAdmissionDto {
  @IsEmail()
  @MaxLength(120)
  email: string;
}

export class VerifyAdmissionEmailDto {
  @IsEmail()
  @MaxLength(120)
  email: string;

  @Matches(/^\d{6}$/)
  otp: string;
}

export class SubmitAdmissionDto {
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
  name: string;

  @IsEmail()
  @MaxLength(120)
  email: string;

  @Matches(/^03\d{9}$/)
  phone: string;

  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
  guardianName: string;

  @Matches(/^03\d{9}$/)
  guardianPhone: string;

  @IsString()
  @Length(2, 60)
  city: string;

  @IsString()
  @Length(5, 220)
  address: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsIn(['male', 'female', 'prefer_not_to_say'])
  gender: Gender;

  @IsString()
  @Length(2, 80)
  educationLevel: string;

  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsIn(['online', 'physical'])
  preferredMode: string;

  @IsString()
  @Length(2, 60)
  preferredTiming: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  preferredDays?: string;

  @IsIn(['monthly', 'quarterly', 'full_course'])
  pricingPlanType: PricingPlanType;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class CreatePaymentIntentDto {
  @IsUUID()
  admissionApplicationId: string;

  @IsIn(['jazzcash', 'easypaisa'])
  gateway: PaymentGateway;
}

export class GatewayCallbackDto {
  @IsString()
  @MaxLength(120)
  merchantTransactionId: string;

  @IsString()
  @MaxLength(80)
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  gatewayReference?: string;

  @IsOptional()
  @IsString()
  secureHash?: string;
}

export class AdminAdmissionsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['all', 'email_pending', 'verified', 'payment_pending', 'payment_failed', 'payment_verified', 'enrolled', 'waitlisted', 'rejected', 'cancelled'])
  status?: string = 'all';
}
