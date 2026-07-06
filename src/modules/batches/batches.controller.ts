import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { BatchesService } from './batches.service';
import { AdminBatchesQueryDto } from './dto/admin-batches-query.dto';
import { CreateAdminBatchDto } from './dto/create-admin-batch.dto';
import { CreateBatchScheduleDto } from './dto/create-batch-schedule.dto';
import { EnrollBatchStudentDto, UpdateBatchEnrollmentStatusDto } from './dto/enroll-batch-student.dto';
import { MarkBatchAttendanceDto } from './dto/mark-batch-attendance.dto';
import { UpdateAdminBatchDto } from './dto/update-admin-batch.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('batches')
@Controller('admin/batches')
export class BatchesController {
  constructor(private readonly service: BatchesService) {}
  @Get() findAll(@Query() query: AdminBatchesQueryDto) { return this.service.findAll(query); }
  @Get('filter-options') filterOptions() { return this.service.filterOptions(); }
  @Get(':id/enrollment-options') enrollmentOptions(@Param('id') id: string, @Query('search') search?: string) { return this.service.enrollmentOptions(id, search); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findDetail(id); }
  @Post() create(@Body() dto: CreateAdminBatchDto, @Req() request: AdminRequest) { return this.service.create(dto, request.user.id); }
  @Post(':id/enroll-student') enrollStudent(@Param('id') id: string, @Body() dto: EnrollBatchStudentDto, @Req() request: AdminRequest) { return this.service.enrollStudent(id, dto, request.user.id); }
  @Patch(':id/students/:studentId/status') enrollmentStatus(@Param('id') id: string, @Param('studentId') studentId: string, @Body() dto: UpdateBatchEnrollmentStatusDto, @Req() request: AdminRequest) { return this.service.updateEnrollmentStatus(id, studentId, dto, request.user.id); }
  @Delete(':id/students/:studentId') removeStudent(@Param('id') id: string, @Param('studentId') studentId: string, @Req() request: AdminRequest) { return this.service.removeStudent(id, studentId, request.user.id); }
  @Post(':id/attendance/mark') markAttendance(@Param('id') id: string, @Body() dto: MarkBatchAttendanceDto, @Req() request: AdminRequest) { return this.service.markAttendance(id, dto, request.user.id); }
  @Post(':id/schedule') createSchedule(@Param('id') id: string, @Body() dto: CreateBatchScheduleDto, @Req() request: AdminRequest) { return this.service.createSchedule(id, dto, request.user.id); }
  @Patch(':id/schedule/:scheduleId/status') scheduleStatus(@Param('id') id: string, @Param('scheduleId') scheduleId: string, @Body('status') status: 'upcoming' | 'completed' | 'cancelled', @Req() request: AdminRequest) { return this.service.updateScheduleStatus(id, scheduleId, status, request.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAdminBatchDto, @Req() request: AdminRequest) { return this.service.update(id, dto, request.user.id); }
  @Patch(':id/status') status(@Param('id') id: string, @Body() dto: UpdateBatchStatusDto, @Req() request: AdminRequest) { return this.service.updateStatus(id, dto.status, request.user.id); }
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
