import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  Attendance,
  AdmissionApplication,
  Assignment,
  AuditLog,
  Batch,
  Certificate,
  Course,
  Enrollment,
  FeePlan,
  StudentProfile,
  User,
} from '../../database/entities';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      User,
      AdmissionApplication,
      StudentProfile,
      Course,
      Batch,
      Enrollment,
      Attendance,
      Assignment,
      FeePlan,
      Certificate,
      AuditLog,
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
