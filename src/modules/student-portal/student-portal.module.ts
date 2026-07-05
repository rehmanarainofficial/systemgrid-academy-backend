import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  Lesson,
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

@Module({
  imports: [
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
      Lesson,
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
  providers: [StudentPortalService],
})
export class StudentPortalModule {}
