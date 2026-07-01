import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CoursesService } from './courses.service';

@Controller('public/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.coursesService.findPublicCourses(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.coursesService.findPublicCourseBySlug(slug);
  }
}
