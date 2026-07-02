import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { BatchesService } from './batches.service';
import { AdminBatchesQueryDto } from './dto/admin-batches-query.dto';
import { CreateAdminBatchDto } from './dto/create-admin-batch.dto';
import { UpdateAdminBatchDto } from './dto/update-admin-batch.dto';
import { UpdateBatchStatusDto } from './dto/update-batch-status.dto';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin, UserRole.Staff)
@Controller('admin/batches')
export class BatchesController {
  constructor(private readonly service: BatchesService) {}
  @Get() findAll(@Query() query: AdminBatchesQueryDto) { return this.service.findAll(query); }
  @Get('filter-options') filterOptions() { return this.service.filterOptions(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateAdminBatchDto, @Req() request: AdminRequest) { return this.service.create(dto, request.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAdminBatchDto, @Req() request: AdminRequest) { return this.service.update(id, dto, request.user.id); }
  @Patch(':id/status') status(@Param('id') id: string, @Body() dto: UpdateBatchStatusDto, @Req() request: AdminRequest) { return this.service.updateStatus(id, dto.status, request.user.id); }
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
