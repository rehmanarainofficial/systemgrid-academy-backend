import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { CreateInstructorAssignmentDto } from './dto/create-instructor-assignment.dto';
import { CreateInstructorLessonDto } from './dto/create-instructor-lesson.dto';
import { GradeInstructorSubmissionDto } from './dto/grade-instructor-submission.dto';
import { MarkInstructorAttendanceDto } from './dto/mark-instructor-attendance.dto';
import { InstructorPortalService } from './instructor-portal.service';

type AuthenticatedRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Instructor)
@Controller('instructor')
export class InstructorPortalController {
  constructor(private readonly service: InstructorPortalService) {}

  @Get('dashboard')
  dashboard(@Req() req: AuthenticatedRequest) {
    return this.service.getDashboard(req.user.id);
  }

  @Get('batches')
  batches(@Req() req: AuthenticatedRequest) {
    return this.service.getBatches(req.user.id);
  }

  @Get('batches/:id')
  batchDetail(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.getBatchDetail(req.user.id, id);
  }

  @Get('schedule')
  schedule(@Req() req: AuthenticatedRequest) {
    return this.service.getSchedule(req.user.id);
  }

  @Get('batches/:id/attendance')
  attendanceData(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('date') date?: string,
  ) {
    return this.service.getAttendanceData(req.user.id, id, date);
  }

  @Post('batches/:id/attendance')
  markAttendance(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: MarkInstructorAttendanceDto,
  ) {
    return this.service.markAttendance(req.user.id, id, dto);
  }

  @Get('assignments')
  assignments(@Req() req: AuthenticatedRequest) {
    return this.service.getAssignments(req.user.id);
  }

  @Post('assignments')
  createAssignment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateInstructorAssignmentDto,
  ) {
    return this.service.createAssignment(req.user.id, dto);
  }

  @Get('submissions')
  submissions(
    @Req() req: AuthenticatedRequest,
    @Query('assignmentId') assignmentId?: string,
  ) {
    return this.service.getSubmissions(req.user.id, assignmentId);
  }

  @Patch('submissions/:id')
  gradeSubmission(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: GradeInstructorSubmissionDto,
  ) {
    return this.service.gradeSubmission(req.user.id, id, dto);
  }

  @Get('lessons')
  lessons(
    @Req() req: AuthenticatedRequest,
    @Query('courseId') courseId?: string,
  ) {
    return this.service.getLessons(req.user.id, courseId);
  }

  @Post('lessons')
  createLesson(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateInstructorLessonDto,
  ) {
    return this.service.createLesson(req.user.id, dto);
  }
}
