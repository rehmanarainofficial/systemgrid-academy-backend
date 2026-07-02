import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Course, CourseCategory } from '../../database/entities';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({ imports: [TypeOrmModule.forFeature([CourseCategory, Course, AuditLog])], controllers: [CategoriesController], providers: [CategoriesService] })
export class CategoriesModule {}
