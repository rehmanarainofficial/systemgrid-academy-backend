import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { InstructorsController } from './instructors.controller';
import { PublicInstructorsController } from './public-instructors.controller';
import { InstructorsService } from './instructors.service';

@Module({
  imports: [UploadsModule],
  controllers: [InstructorsController, PublicInstructorsController],
  providers: [InstructorsService],
})
export class InstructorsModule {}
