import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Access, SuperAdminOnly } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ResetAdminUserPasswordDto } from './dto/reset-admin-user-password.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UsersService } from './users.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('users')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: AdminUsersQueryDto) {
    return this.usersService.findAdminUsers(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findAdminUser(id);
  }

  @SuperAdminOnly()
  @Post()
  create(@Body() dto: CreateAdminUserDto, @Req() request: AdminRequest) {
    return this.usersService.createAdminUser(dto, request.user.id);
  }

  @SuperAdminOnly()
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminUserDto, @Req() request: AdminRequest) {
    return this.usersService.updateAdminUser(id, dto, request.user.id);
  }

  @SuperAdminOnly()
  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() dto: ResetAdminUserPasswordDto, @Req() request: AdminRequest) {
    return this.usersService.resetAdminPassword(id, dto, request.user.id);
  }

  @SuperAdminOnly()
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.usersService.deleteAdminUser(id, request.user.id);
  }
}
