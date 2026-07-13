import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { User } from '../../database/entities';
import type { UploadedFileData } from '../uploads/uploads.service';
import { UploadsService } from '../uploads/uploads.service';
import { AdminInstructorsQueryDto } from './dto/admin-instructors-query.dto';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorsService } from './instructors.service';

type AdminRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('instructors')
@Controller('admin/instructors')
export class InstructorsController {
  constructor(
    private readonly service: InstructorsService,
    private readonly uploadsService: UploadsService,
  ) {}
  @Get() findAll(@Query() query: AdminInstructorsQueryDto) { return this.service.findAll(query); }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadImage(
    @UploadedFile() file: UploadedFileData,
    @Req() request: AdminRequest,
  ) {
    return this.uploadsService.saveImage(file, 'instructors', request.user.id, {
      forceS3: true,
    });
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateInstructorDto, @Req() request: AdminRequest) { return this.service.create(dto, request.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateInstructorDto, @Req() request: AdminRequest) { return this.service.update(id, dto, request.user.id); }
  @Patch(':id/toggle-status') toggle(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.toggle(id, request.user.id); }
  @Delete(':id') remove(@Param('id') id: string, @Req() request: AdminRequest) { return this.service.remove(id, request.user.id); }
}
