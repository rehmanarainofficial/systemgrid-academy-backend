import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { ClassRecordingsQueryDto } from './dto/class-recordings-query.dto';
import { CreateClassRecordingDto } from './dto/create-class-recording.dto';
import { UpdateClassRecordingDto } from './dto/update-class-recording.dto';
import { ClassRecordingsService } from './class-recordings.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('class-recordings')
@Controller('admin/class-recordings')
export class ClassRecordingsController {
  constructor(private readonly service: ClassRecordingsService) {}

  @Get()
  findAll(@Query() query: ClassRecordingsQueryDto) {
    return this.service.findAll(query);
  }

  @Get('filter-options')
  filterOptions() {
    return this.service.filterOptions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateClassRecordingDto, @Req() request: AdminRequest) {
    return this.service.create(dto, request.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassRecordingDto,
    @Req() request: AdminRequest,
  ) {
    return this.service.update(id, dto, request.user.id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.service.setPublished(id, true, request.user.id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.service.setPublished(id, false, request.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.service.remove(id, request.user.id);
  }
}
