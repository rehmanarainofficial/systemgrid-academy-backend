import { Module } from '@nestjs/common';
import { AdminAlertsService } from './admin-alerts.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, AdminAlertsService],
  exports: [AdminAlertsService],
})
export class NotificationsModule {}
