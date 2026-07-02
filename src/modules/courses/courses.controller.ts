import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { AdminCoursesQueryDto } from './dto/admin-courses-query.dto';
import { CreateAdminCourseDto } from './dto/create-admin-course.dto';
import { UpdateAdminCourseDto } from './dto/update-admin-course.dto';
import { CoursesService } from './courses.service';

type AdminRequest = Request & { user: User };

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

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin, UserRole.Staff)
@Controller('admin/courses')
export class AdminCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(@Query() query: AdminCoursesQueryDto) {
    return this.coursesService.findAdminCourses(query);
  }

  @Get('filter-options')
  filterOptions() {
    return this.coursesService.getAdminFilterOptions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findAdminCourse(id);
  }

  @Post()
  create(@Body() dto: CreateAdminCourseDto, @Req() request: AdminRequest) {
    return this.coursesService.createAdminCourse(dto, request.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminCourseDto,
    @Req() request: AdminRequest,
  ) {
    return this.coursesService.updateAdminCourse(id, dto, request.user.id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.coursesService.setPublished(id, true, request.user.id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.coursesService.setPublished(id, false, request.user.id);
  }

  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.coursesService.deleteAdminCourse(id, request.user.id);
  }
}
