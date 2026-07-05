import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { PricingPlanType } from '../../../database/entities';

export class PricingCalculateDto {
  @IsUUID()
  courseId: string;

  @IsIn(['monthly', 'quarterly', 'full_course'])
  pricingPlanType: PricingPlanType;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  referralCode?: string;

  @IsOptional()
  @IsBoolean()
  scholarshipEligible?: boolean;
}
