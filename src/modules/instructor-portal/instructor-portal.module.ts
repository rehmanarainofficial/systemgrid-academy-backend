import { Module } from '@nestjs/common';
import { InstructorPortalController } from './instructor-portal.controller';
import { InstructorPortalService } from './instructor-portal.service';

@Module({
  controllers: [InstructorPortalController],
  providers: [InstructorPortalService],
})
export class InstructorPortalModule {}
