import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AdminNotificationsQueryDto } from './dto/admin-notifications-query.dto';
import { SendAdminNotificationDto } from './dto/send-admin-notification.dto';
import { NotificationsService } from './notifications.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('notifications')
@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Get() findAll(@Query() query: AdminNotificationsQueryDto) { return this.service.findAll(query); }
  @Get('count') count(@Req() request: AdminRequest) { return this.service.count(request.user.id); }
  @Get('options') options() { return this.service.options(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post('send') send(@Body() dto: SendAdminNotificationDto, @Req() request: AdminRequest) { return this.service.send(dto, request.user.id); }
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
