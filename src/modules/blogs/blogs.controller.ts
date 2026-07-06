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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import type { UploadedFileData } from '../uploads/uploads.service';
import { UploadsService } from '../uploads/uploads.service';
import { BlogsService } from './blogs.service';
import { AdminBlogQueryDto, PublicBlogQueryDto } from './dto/blog-query.dto';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

type AdminRequest = Request & { user: User };

@Controller('public/blog')
export class PublicBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  findAll(@Query() query: PublicBlogQueryDto) {
    return this.blogsService.findPublicPosts(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.blogsService.findPublicPost(slug);
  }
}

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('blog')
@Controller('admin/blog')
export class AdminBlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get()
  findAll(@Query() query: AdminBlogQueryDto) {
    return this.blogsService.findAdminPosts(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogsService.findAdminPost(id);
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadImage(
    @UploadedFile() file: UploadedFileData,
    @Req() request: AdminRequest,
  ) {
    return this.uploadsService.saveImage(file, 'blogs', request.user.id);
  }

  @Post()
  create(@Body() dto: CreateBlogPostDto, @Req() request: AdminRequest) {
    return this.blogsService.create(dto, request.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBlogPostDto,
    @Req() request: AdminRequest,
  ) {
    return this.blogsService.update(id, dto, request.user.id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.blogsService.setPublished(id, true, request.user.id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.blogsService.setPublished(id, false, request.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AdminRequest) {
    return this.blogsService.remove(id, request.user.id);
  }
}
