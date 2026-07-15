import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionsModule } from '../admissions/admissions.module';
import { UploadsModule } from '../uploads/uploads.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  Attendance,
  Assignment,
  AssignmentSubmission,
  Certificate,
  ClassSchedule,
  CourseModule,
  CourseResource,
  Enrollment,
  FeePlan,
  Invoice,
  ClassRecording,
  Notification,
  Payment,
  ReferralCode,
  ReferralRedemption,
  StudentProfile,
  StudentWallet,
  User,
  WalletLedger,
} from '../../database/entities';
import {
  PublicCertificatesController,
  StudentPortalController,
} from './student-portal.controller';
import { StudentPortalService } from './student-portal.service';
import { FeeRemindersService } from './fee-reminders.service';
import { StudentPortalAccessGuard } from '../../common/guards/student-portal-access.guard';

@Module({
  imports: [
    AdmissionsModule,
    UploadsModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      Attendance,
      Assignment,
      AssignmentSubmission,
      Certificate,
      ClassSchedule,
      CourseModule,
      CourseResource,
      Enrollment,
      FeePlan,
      Invoice,
      ClassRecording,
      Notification,
      Payment,
      ReferralCode,
      ReferralRedemption,
      StudentProfile,
      StudentWallet,
      User,
      WalletLedger,
    ]),
  ],
  controllers: [StudentPortalController, PublicCertificatesController],
  providers: [StudentPortalService, FeeRemindersService, StudentPortalAccessGuard],
})
export class StudentPortalModule {}
