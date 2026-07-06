import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AdminAssignmentsQueryDto } from './dto/admin-assignments-query.dto';
import { CreateAdminAssignmentDto } from './dto/create-admin-assignment.dto';
import { UpdateAdminAssignmentDto } from './dto/update-admin-assignment.dto';
import { AssignmentsService } from './assignments.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('assignments')
@Controller('admin/assignments')
export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}
  @Get() findAll(@Query() query: AdminAssignmentsQueryDto) { return this.service.findAll(query); }
  @Get('filter-options') filterOptions() { return this.service.filterOptions(); }
  @Get(':id/submissions') submissions(@Param('id') id: string) { return this.service.submissions(id); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateAdminAssignmentDto, @Req() request: AdminRequest) { return this.service.create(dto, request.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAdminAssignmentDto, @Req() request: AdminRequest) { return this.service.update(id, dto, request.user.id); }
  @Patch(':id/publish') publish(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.setPublished(id, true, request.user.id); }
  @Patch(':id/unpublish') unpublish(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.setPublished(id, false, request.user.id); }
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
