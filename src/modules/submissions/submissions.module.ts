import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentSubmission, AuditLog } from '../../database/entities';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({ imports: [TypeOrmModule.forFeature([AssignmentSubmission, AuditLog])], controllers: [SubmissionsController], providers: [SubmissionsService] })
export class SubmissionsModule {}
