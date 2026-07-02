import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Attendance,
  Batch,
  Certificate,
  Course,
  Enrollment,
  FeePlan,
  Lead,
  Payment,
  StudentProfile,
} from '../../database/entities';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentProfile,
      Lead,
      Course,
      Batch,
      Enrollment,
      Payment,
      FeePlan,
      Attendance,
      Certificate,
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
