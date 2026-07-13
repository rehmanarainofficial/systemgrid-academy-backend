import { Module } from '@nestjs/common';
import { AdminAlertsService } from './admin-alerts.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { StudentNotificationsService } from './student-notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, AdminAlertsService, StudentNotificationsService],
  exports: [AdminAlertsService, StudentNotificationsService],
})
export class NotificationsModule {}
