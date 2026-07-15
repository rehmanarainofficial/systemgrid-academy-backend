import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Batch, Course, CourseCategory, CourseFAQ, CourseModule, CourseOutlineModule, CourseOutcome, CourseProject, CourseQuarter, CourseTool, CourseTopic, Enrollment, Offer } from '../../database/entities';
import { AdminCoursesController, CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseCategory, Enrollment, Batch, CourseModule, CourseQuarter, CourseOutlineModule, CourseTopic, CourseTool, CourseProject, CourseOutcome, CourseFAQ, Offer, AuditLog]),
    UploadsModule,
  ],
  controllers: [CoursesController, AdminCoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
