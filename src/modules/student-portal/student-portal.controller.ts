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
import { ChangeStudentPasswordDto } from './dto/change-student-password.dto';
import { StudentNotificationsQueryDto } from './dto/student-notifications-query.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentPortalService } from './student-portal.service';

type AuthenticatedRequest = Request & { user: User };

@UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
@Roles(UserRole.Student)
@Controller('student')
export class StudentPortalController {
  constructor(private readonly studentPortalService: StudentPortalService) {}

  @Get('dashboard')
  getDashboard(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getDashboard(request.user.id);
  }

  @Get('schedule')
  getSchedule(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getSchedule(request.user.id);
  }

  @Get('attendance')
  getAttendance(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getAttendance(request.user.id);
  }

  @Get('assignments')
  getAssignments(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getAssignments(request.user.id);
  }

  @Get('assignments/:assignmentId')
  getAssignmentDetail(
    @Req() request: AuthenticatedRequest,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.studentPortalService.getAssignmentDetail(
      request.user.id,
      assignmentId,
    );
  }

  @Get('payments')
  getPayments(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getPayments(request.user.id);
  }

  @Get('wallet')
  getWallet(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getWallet(request.user.id);
  }

  @Get('referrals')
  getReferrals(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getReferrals(request.user.id);
  }

  @Get('certificates')
  getCertificates(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getCertificates(request.user.id);
  }

  @Get('notifications')
  getNotifications(
    @Req() request: AuthenticatedRequest,
    @Query() query: StudentNotificationsQueryDto,
  ) {
    return this.studentPortalService.getNotifications(request.user.id, query);
  }

  @Patch('notifications/read-all')
  markAllNotificationsAsRead(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.markAllNotificationsAsRead(request.user.id);
  }

  @Patch('notifications/:notificationId/read')
  markNotificationAsRead(
    @Req() request: AuthenticatedRequest,
    @Param('notificationId') notificationId: string,
  ) {
    return this.studentPortalService.markNotificationAsRead(
      request.user.id,
      notificationId,
    );
  }

  @Delete('notifications/:notificationId')
  deleteNotification(
    @Req() request: AuthenticatedRequest,
    @Param('notificationId') notificationId: string,
  ) {
    return this.studentPortalService.deleteNotification(
      request.user.id,
      notificationId,
    );
  }

  @Get('profile')
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getProfile(request.user.id);
  }

  @Patch('profile')
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.studentPortalService.updateProfile(request.user.id, dto);
  }

  @Patch('profile/password')
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangeStudentPasswordDto,
  ) {
    return this.studentPortalService.changePassword(request.user.id, dto);
  }

  @Get('certificates/:certificateId')
  getCertificateDetail(
    @Req() request: AuthenticatedRequest,
    @Param('certificateId') certificateId: string,
  ) {
    return this.studentPortalService.getCertificateDetail(
      request.user.id,
      certificateId,
    );
  }

  @Post('assignments/:assignmentId/submit')
  submitAssignment(
    @Req() request: AuthenticatedRequest,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.studentPortalService.submitAssignment(
      request.user.id,
      assignmentId,
      dto,
    );
  }

  @Get('my-courses')
  getMyCourses(@Req() request: AuthenticatedRequest) {
    return this.studentPortalService.getMyCourses(request.user.id);
  }

  @Get('my-courses/:courseId')
  getCourseDetail(
    @Req() request: AuthenticatedRequest,
    @Param('courseId') courseId: string,
  ) {
    return this.studentPortalService.getCourseDetail(request.user.id, courseId);
  }
}

@Controller('public/certificates')
export class PublicCertificatesController {
  constructor(private readonly studentPortalService: StudentPortalService) {}

  @Get('verify/:verificationCode')
  verifyCertificate(@Param('verificationCode') verificationCode: string) {
    return this.studentPortalService.verifyPublicCertificate(verificationCode);
  }
}
