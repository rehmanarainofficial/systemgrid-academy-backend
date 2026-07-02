import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Batch, Course, CourseCategory, CourseModule, Enrollment, Lesson } from '../../database/entities';
import { AdminCoursesController, CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseCategory, Enrollment, Batch, CourseModule, Lesson, AuditLog])],
  controllers: [CoursesController, AdminCoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
