import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { AdminLessonsQueryDto } from './dto/admin-lessons-query.dto';
import { CreateAdminLessonDto } from './dto/create-admin-lesson.dto';
import { UpdateAdminLessonDto } from './dto/update-admin-lesson.dto';
import { LessonsService } from './lessons.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin, UserRole.Staff)
@Controller('admin/lessons')
export class LessonsController {
  constructor(private readonly service: LessonsService) {}
  @Get() findAll(@Query() query: AdminLessonsQueryDto) { return this.service.findAll(query); }
  @Get('filter-options') filterOptions() { return this.service.filterOptions(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateAdminLessonDto, @Req() request: AdminRequest) { return this.service.create(dto, request.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAdminLessonDto, @Req() request: AdminRequest) { return this.service.update(id, dto, request.user.id); }
  @Patch(':id/publish') publish(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.setPublished(id, true, request.user.id); }
  @Patch(':id/unpublish') unpublish(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.setPublished(id, false, request.user.id); }
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
