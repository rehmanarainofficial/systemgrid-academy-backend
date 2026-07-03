import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { AdminSubmissionsQueryDto } from './dto/admin-submissions-query.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmissionsService } from './submissions.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin, UserRole.Staff)
@Controller('admin/submissions')
export class SubmissionsController {
  constructor(private readonly service: SubmissionsService) {}
  @Get() findAll(@Query() query: AdminSubmissionsQueryDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id/review') review(@Param('id') id: string, @Body() dto: ReviewSubmissionDto, @Req() request: AdminRequest) { return this.service.review(id, dto, request.user.id); }
  @Patch(':id/status') status(@Param('id') id: string, @Body() dto: Pick<ReviewSubmissionDto, 'status'>, @Req() request: AdminRequest) { return this.service.updateStatus(id, dto.status, request.user.id); }
}
