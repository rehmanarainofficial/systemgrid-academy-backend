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
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { AdminStudentsQueryDto } from './dto/admin-students-query.dto';
import { CreateAdminStudentDto } from './dto/create-admin-student.dto';
import { EnrollAdminStudentDto } from './dto/enroll-admin-student.dto';
import { ResetStudentPasswordDto } from './dto/reset-student-password.dto';
import { UpdateAdminStudentDto } from './dto/update-admin-student.dto';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto';
import { StudentsService } from './students.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin, UserRole.Staff)
@Controller('admin/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll(@Query() query: AdminStudentsQueryDto) {
    return this.studentsService.findAdminList(query);
  }

  @Get('filter-options')
  filterOptions() {
    return this.studentsService.getFilterOptions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findAdminDetail(id);
  }

  @Post()
  create(@Body() dto: CreateAdminStudentDto, @Req() request: AdminRequest) {
    return this.studentsService.createAdmin(dto, request.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminStudentDto,
    @Req() request: AdminRequest,
  ) {
    return this.studentsService.updateAdmin(id, dto, request.user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStudentStatusDto,
    @Req() request: AdminRequest,
  ) {
    return this.studentsService.updateStatus(id, dto, request.user.id);
  }

  @Post(':id/enroll')
  enroll(
    @Param('id') id: string,
    @Body() dto: EnrollAdminStudentDto,
    @Req() request: AdminRequest,
  ) {
    return this.studentsService.enroll(id, dto, request.user.id);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetStudentPasswordDto,
    @Req() request: AdminRequest,
  ) {
    return this.studentsService.resetPassword(id, dto, request.user.id);
  }

  @Roles(UserRole.SuperAdmin)
  @Delete(':id')
  archive(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.studentsService.archive(id, request.user.id);
  }
}
