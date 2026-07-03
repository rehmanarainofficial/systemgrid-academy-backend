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
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      StudentProfile,
      Payment,
      FeePlan,
      Attendance,
      Course,
      Batch,
      Enrollment,
      Certificate,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
