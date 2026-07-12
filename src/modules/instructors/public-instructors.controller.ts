import { Controller, Get } from '@nestjs/common';
import { InstructorsService } from './instructors.service';

@Controller('public/instructors')
export class PublicInstructorsController {
  constructor(private readonly service: InstructorsService) {}

  @Get()
  findAll() {
    return this.service.findPublic();
  }
}
