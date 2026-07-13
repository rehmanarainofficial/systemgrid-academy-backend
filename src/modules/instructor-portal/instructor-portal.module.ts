import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { InstructorPortalController } from './instructor-portal.controller';
import { InstructorPortalService } from './instructor-portal.service';

@Module({
  imports: [NotificationsModule],
  controllers: [InstructorPortalController],
  providers: [InstructorPortalService],
})
export class InstructorPortalModule {}
