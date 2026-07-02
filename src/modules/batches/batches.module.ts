import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Batch, Course, Enrollment, Instructor } from '../../database/entities';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';

@Module({ imports: [TypeOrmModule.forFeature([Batch, Course, Instructor, Enrollment, AuditLog])], controllers: [BatchesController], providers: [BatchesService] })
export class BatchesModule {}
