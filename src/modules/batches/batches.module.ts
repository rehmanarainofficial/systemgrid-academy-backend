import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment, Attendance, AuditLog, Batch, ClassSchedule, Course, Enrollment, FeePlan, Instructor, Lesson, StudentProfile } from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Batch, Course, Instructor, Enrollment, AuditLog, Assignment, Attendance, ClassSchedule, FeePlan, Lesson, StudentProfile]),
    NotificationsModule,
  ],
  controllers: [BatchesController],
  providers: [BatchesService],
})
export class BatchesModule {}
