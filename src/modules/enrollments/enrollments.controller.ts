import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { User } from '../../database/entities';
import { AdminEnrollmentsQueryDto } from './dto/admin-enrollments-query.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { EnrollmentsService } from './enrollments.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('enrollments')
@Controller('admin/enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  findAll(@Query() query: AdminEnrollmentsQueryDto) {
    return this.enrollmentsService.findAdminList(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentsService.findAdminDetail(id);
  }

  @Post()
  create(@Body() dto: CreateEnrollmentDto, @Req() request: AdminRequest) {
    return this.enrollmentsService.create(dto, request.user.id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEnrollmentStatusDto, @Req() request: AdminRequest) {
    return this.enrollmentsService.updateStatus(id, dto, request.user.id);
  }
}
