import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmissionsService } from './submissions.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin, UserRole.Staff)
@Controller('admin/submissions')
export class SubmissionsController {
  constructor(private readonly service: SubmissionsService) {}
  @Patch(':id/review') review(@Param('id') id: string, @Body() dto: ReviewSubmissionDto, @Req() request: AdminRequest) { return this.service.review(id, dto, request.user.id); }
}
