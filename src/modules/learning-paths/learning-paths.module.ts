import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LearningPath,
  LearningPathCourse,
  LearningPathOutcome,
  LearningPathPhase,
} from '../../database/entities';
import {
  AdminLearningPathsController,
  PublicLearningPathsController,
} from './learning-paths.controller';
import { LearningPathsService } from './learning-paths.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningPath,
      LearningPathPhase,
      LearningPathOutcome,
      LearningPathCourse,
    ]),
  ],
  controllers: [PublicLearningPathsController, AdminLearningPathsController],
  providers: [LearningPathsService],
  exports: [LearningPathsService],
})
export class LearningPathsModule {}
