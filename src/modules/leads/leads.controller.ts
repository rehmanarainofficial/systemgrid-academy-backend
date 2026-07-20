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
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AdminLeadsQueryDto } from './dto/admin-leads-query.dto';
import { ConvertLeadToStudentDto } from './dto/convert-lead-to-student.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

type AdminRequest = Request & { user: User };

@Controller('public')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('leads')
  createLead(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create({
      ...createLeadDto,
      source: createLeadDto.source ?? 'website',
    });
  }

  @Post('demo-class')
  createDemoRequest(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create({
      ...createLeadDto,
      source: 'free_demo_class_page',
    });
  }
}

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('leads')
@Controller('admin/leads')
export class AdminLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@Query() query: AdminLeadsQueryDto) {
    return this.leadsService.findAdminList(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leadsService.findAdminDetail(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @Req() request: AdminRequest,
  ) {
    return this.leadsService.updateAdmin(id, dto, request.user.id);
  }

  @Post(':id/convert-to-student')
  convert(
    @Param('id') id: string,
    @Body() dto: ConvertLeadToStudentDto,
    @Req() request: AdminRequest,
  ) {
    return this.leadsService.convertToStudent(id, dto, request.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.leadsService.deleteAdmin(id, request.user.id);
  }
}
