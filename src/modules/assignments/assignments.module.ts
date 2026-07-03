import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment, AssignmentSubmission, AuditLog, Batch, Course, CourseModule } from '../../database/entities';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({ imports: [TypeOrmModule.forFeature([Assignment, AssignmentSubmission, Course, CourseModule, Batch, AuditLog])], controllers: [AssignmentsController], providers: [AssignmentsService] })
export class AssignmentsModule {}
