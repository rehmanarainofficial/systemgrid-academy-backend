import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto';
import { AttendanceMarkDataQueryDto } from './dto/attendance-mark-data-query.dto';
import { MarkAdminAttendanceDto } from './dto/mark-admin-attendance.dto';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';
import { AttendanceService } from './attendance.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('attendance')
@Controller('admin/attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}
  @Get() findAll(@Query() query: AdminAttendanceQueryDto) { return this.service.findAll(query); }
  @Get('mark-data') markData(@Query() query: AttendanceMarkDataQueryDto) { return this.service.markData(query); }
  @Post('mark') mark(@Body() dto: MarkAdminAttendanceDto, @Req() request: AdminRequest) { return this.service.mark(dto, request.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAttendanceRecordDto, @Req() request: AdminRequest) { return this.service.update(id, dto, request.user.id); }
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
