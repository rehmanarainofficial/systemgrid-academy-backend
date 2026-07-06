import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access, SuperAdminOnly } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AdmissionsService } from './admissions.service';
import { AdminAdmissionsQueryDto } from './dto/admission.dto';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('admissions')
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
  @SuperAdminOnly()
  updateOffer(@Param('id') id: string, @Req() request: AdminRequest, @Body() body: { isActive?: boolean; discountPercentage?: number; discountAmount?: number }) {
    return this.admissionsService.updateOffer(id, body, request.user.id);
  }

  @Get('referrals')
  referrals() {
    return this.admissionsService.listReferrals();
  }
}
