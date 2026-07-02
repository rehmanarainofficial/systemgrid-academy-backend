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
  StudentProfile,
  User,
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
      StudentProfile,
      User,
    ]),
  ],
  controllers: [StudentPortalController, PublicCertificatesController],
  providers: [StudentPortalService],
})
export class StudentPortalModule {}
