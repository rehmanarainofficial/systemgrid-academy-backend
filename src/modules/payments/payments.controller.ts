import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { AdminPaymentsQueryDto } from './dto/admin-payments-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin, UserRole.Staff)
@Controller('admin/payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}
  @Get() findAll(@Query() query: AdminPaymentsQueryDto) { return this.service.findAll(query); }
  @Get('options') options() { return this.service.options(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreatePaymentDto, @Req() request: AdminRequest) { return this.service.create(dto, request.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdatePaymentDto, @Req() request: AdminRequest) { return this.service.update(id, dto, request.user.id); }
  @Patch(':id/verify') verify(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.verify(id, request.user.id); }
  @Patch(':id/reject') reject(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.reject(id, request.user.id); }
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
