import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { AdmissionsService } from './admissions.service';
import { AdminAdmissionsQueryDto } from './dto/admission.dto';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin, UserRole.Staff)
@Controller('admin')
export class AdminAdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Get('admissions')
  admissions(@Query() query: AdminAdmissionsQueryDto) {
    return this.admissionsService.listAdmin(query);
  }

  @Get('offers')
  offers() {
    return this.admissionsService.listOffers();
  }

  @Patch('offers/:id')
  @Roles(UserRole.SuperAdmin)
  updateOffer(@Param('id') id: string, @Req() request: AdminRequest, @Body() body: { isActive?: boolean; discountPercentage?: number; discountAmount?: number }) {
    return this.admissionsService.updateOffer(id, body, request.user.id);
  }

  @Get('referrals')
  referrals() {
    return this.admissionsService.listReferrals();
  }
}
