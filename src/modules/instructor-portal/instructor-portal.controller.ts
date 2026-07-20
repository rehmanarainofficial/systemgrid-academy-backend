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
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '../../database/entities';
import { CreateInstructorAssignmentDto } from './dto/create-instructor-assignment.dto';
import { CreateInstructorClassRecordingDto } from './dto/create-instructor-class-recording.dto';
import { UpdateInstructorClassRecordingDto } from './dto/update-instructor-class-recording.dto';
import { GradeInstructorSubmissionDto } from './dto/grade-instructor-submission.dto';
import { InstructorNotificationsQueryDto } from './dto/instructor-notifications-query.dto';
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

  @Get('notifications')
  notifications(
    @Req() req: AuthenticatedRequest,
    @Query() query: InstructorNotificationsQueryDto,
  ) {
    return this.service.getNotifications(req.user.id, query);
  }

  @Get('notifications/count')
  notificationCount(@Req() req: AuthenticatedRequest) {
    return this.service.getNotificationCount(req.user.id);
  }

  @Patch('notifications/read-all')
  markAllNotificationsAsRead(@Req() req: AuthenticatedRequest) {
    return this.service.markAllNotificationsAsRead(req.user.id);
  }

  @Patch('notifications/:notificationId/read')
  markNotificationAsRead(
    @Req() req: AuthenticatedRequest,
    @Param('notificationId') notificationId: string,
  ) {
    return this.service.markNotificationAsRead(req.user.id, notificationId);
  }

  @Delete('notifications/:notificationId')
  deleteNotification(
    @Req() req: AuthenticatedRequest,
    @Param('notificationId') notificationId: string,
  ) {
    return this.service.deleteNotification(req.user.id, notificationId);
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

  @Get('class-recordings')
  classRecordings(
    @Req() req: AuthenticatedRequest,
    @Query('courseId') courseId?: string,
    @Query('batchId') batchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getClassRecordings(req.user.id, courseId, batchId, dateFrom, dateTo);
  }

  @Get('courses/:courseId/modules')
  courseModules(
    @Req() req: AuthenticatedRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.service.getCourseModules(req.user.id, courseId);
  }

  @Post('class-recordings')
  createClassRecording(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateInstructorClassRecordingDto,
  ) {
    return this.service.createClassRecording(req.user.id, dto);
  }

  @Patch('class-recordings/:id')
  updateClassRecording(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateInstructorClassRecordingDto,
  ) {
    return this.service.updateClassRecording(req.user.id, id, dto);
  }

  @Delete('class-recordings/:id')
  deleteClassRecording(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.deleteClassRecording(req.user.id, id);
  }
}
