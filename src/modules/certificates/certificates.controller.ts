import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AdminCertificatesQueryDto } from './dto/admin-certificates-query.dto';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { CertificatesService } from './certificates.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('certificates')
@Controller('admin/certificates')
export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}
  @Get() findAll(@Query() query: AdminCertificatesQueryDto) { return this.service.findAll(query); }
  @Get('eligibility') eligibility() { return this.service.eligibility(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() issue(@Body() dto: IssueCertificateDto, @Req() request: AdminRequest) { return this.service.issue(dto, request.user.id); }
  @Patch(':id/revoke') revoke(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.revoke(id, request.user.id); }
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
