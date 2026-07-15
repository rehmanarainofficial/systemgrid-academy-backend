import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access, SuperAdminOnly } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AdmissionsService } from './admissions.service';
import { AdminAdmissionsQueryDto, ApproveOfflinePaymentDto, CreateAdminOfferDto, UpdateAdminOfferDto } from './dto/admission.dto';

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

  @Post('admissions/:id/approve-payment')
  approveOfflinePayment(
    @Param('id') id: string,
    @Req() request: AdminRequest,
    @Body() dto: ApproveOfflinePaymentDto,
  ) {
    return this.admissionsService.approveOfflinePayment(id, dto, request.user.id);
  }

  @Get('offers')
  offers() {
    return this.admissionsService.listOffers();
  }

  @Post('offers')
  @SuperAdminOnly()
  createOffer(@Req() request: AdminRequest, @Body() dto: CreateAdminOfferDto) {
    return this.admissionsService.createOffer(dto, request.user.id);
  }

  @Patch('offers/:id')
  @SuperAdminOnly()
  updateOffer(@Param('id') id: string, @Req() request: AdminRequest, @Body() dto: UpdateAdminOfferDto) {
    return this.admissionsService.updateOffer(id, dto, request.user.id);
  }

  @Delete('offers/:id')
  @SuperAdminOnly()
  deleteOffer(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.admissionsService.deleteOffer(id, request.user.id);
  }

  @Get('referrals')
  referrals() {
    return this.admissionsService.listReferrals();
  }
}
