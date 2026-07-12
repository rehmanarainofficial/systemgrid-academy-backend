import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { PublicInstructorsController } from './public-instructors.controller';
import { InstructorsService } from './instructors.service';

@Module({ controllers: [InstructorsController, PublicInstructorsController], providers: [InstructorsService] })
export class InstructorsModule {}
