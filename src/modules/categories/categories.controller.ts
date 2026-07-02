import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { AdminCategoriesQueryDto } from './dto/admin-categories-query.dto';
import { CreateAdminCategoryDto } from './dto/create-admin-category.dto';
import { UpdateAdminCategoryDto } from './dto/update-admin-category.dto';
import { CategoriesService } from './categories.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.SuperAdmin, UserRole.Staff)
@Controller('admin/categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get() findAll(@Query() query: AdminCategoriesQueryDto) { return this.service.findAll(query); }
  @Post() create(@Body() dto: CreateAdminCategoryDto, @Req() request: AdminRequest) { return this.service.create(dto, request.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAdminCategoryDto, @Req() request: AdminRequest) { return this.service.update(id, dto, request.user.id); }
  @Patch(':id/toggle-status') toggle(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.toggleStatus(id, request.user.id); }
  @Roles(UserRole.Admin, UserRole.SuperAdmin)
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
