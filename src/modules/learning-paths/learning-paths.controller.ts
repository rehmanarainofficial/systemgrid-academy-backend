import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import { AdminLearningPathsQueryDto } from './dto/admin-learning-paths-query.dto';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateLearningPathDto } from './dto/update-learning-path.dto';
import { LearningPathsService } from './learning-paths.service';

type AdminRequest = Request & { user: User };

@Controller('public/learning-paths')
export class PublicLearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.learningPathsService.findPublicPaths(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.learningPathsService.findPublicPathBySlug(slug);
  }
}

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('learning-paths')
@Controller('admin/learning-paths')
export class AdminLearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @Get()
  findAll(@Query() query: AdminLearningPathsQueryDto) {
    return this.learningPathsService.findAdminPaths(query);
  }

  @Get('filter-options')
  filterOptions() {
    return this.learningPathsService.getAdminFilterOptions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.learningPathsService.findAdminPath(id);
  }

  @Post()
  create(@Body() dto: CreateLearningPathDto, @Req() request: AdminRequest) {
    return this.learningPathsService.createAdminPath(dto, request.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLearningPathDto,
    @Req() request: AdminRequest,
  ) {
    return this.learningPathsService.updateAdminPath(id, dto, request.user.id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.learningPathsService.setPublished(id, true, request.user.id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.learningPathsService.setPublished(id, false, request.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.learningPathsService.deleteAdminPath(id, request.user.id);
  }
}
