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
import { UploadsModule } from '../uploads/uploads.module';
import { NotificationsModule } from '../notifications/notifications.module';
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
    UploadsModule,
    NotificationsModule,
  ],
  controllers: [PublicAdmissionsController, AdminAdmissionsController],
  providers: [AdmissionsService, PricingService, AdmissionEmailService],
  exports: [AdmissionsService, PricingService, AdmissionEmailService],
})
export class AdmissionsModule {}
