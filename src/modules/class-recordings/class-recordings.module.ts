import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Batch, ClassRecording, Course } from '../../database/entities';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClassRecordingsController } from './class-recordings.controller';
import { ClassRecordingsService } from './class-recordings.service';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([ClassRecording, Course, Batch, AuditLog]),
  ],
  controllers: [ClassRecordingsController],
  providers: [ClassRecordingsService],
  exports: [ClassRecordingsService],
})
export class ClassRecordingsModule {}
