import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AdmissionApplication,
  Course,
  Invoice,
  Offer,
  PaymentIntent,
  ReferralCode,
  ReferralRedemption,
  StudentWallet,
  WalletLedger,
} from '../../database/entities';
import { AdminAdmissionsController } from './admin-admissions.controller';
import { AdmissionsService } from './admissions.service';
import { AdmissionEmailService } from './email.service';
import { PricingService } from './pricing.service';
import { PublicAdmissionsController } from './public-admissions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdmissionApplication,
      Course,
      Invoice,
      Offer,
      PaymentIntent,
      ReferralCode,
      ReferralRedemption,
      StudentWallet,
      WalletLedger,
    ]),
  ],
  controllers: [PublicAdmissionsController, AdminAdmissionsController],
  providers: [AdmissionsService, PricingService, AdmissionEmailService],
  exports: [AdmissionsService, PricingService],
})
export class AdmissionsModule {}
