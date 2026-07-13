import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmissionsModule } from '../admissions/admissions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditLog, Batch, Course, Enrollment, Lead, StudentProfile, User } from '../../database/entities';
import { AdminLeadsController, LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, User, StudentProfile, Course, Batch, Enrollment, AuditLog]),
    NotificationsModule,
    AdmissionsModule,
  ],
  controllers: [LeadsController, AdminLeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
