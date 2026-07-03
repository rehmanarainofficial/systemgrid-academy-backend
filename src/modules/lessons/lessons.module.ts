import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, ClassSchedule, Course, CourseModule, Lesson } from '../../database/entities';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';

@Module({ imports: [TypeOrmModule.forFeature([Lesson, Course, CourseModule, ClassSchedule, AuditLog])], controllers: [LessonsController], providers: [LessonsService] })
export class LessonsModule {}
