import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Access } from '../../common/decorators/access.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AdminReportsQueryDto } from './dto/admin-reports-query.dto';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Access('reports')
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  getReports(@Query() query: AdminReportsQueryDto) {
    return this.reportsService.getReports(query);
  }

  @Get('admissions')
  getAdmissionsReport(@Query() query: AdminReportsQueryDto) {
    return this.reportsService.getAdmissionsReport(query);
  }

  @Get('fees')
  getFeesReport(@Query() query: AdminReportsQueryDto) {
    return this.reportsService.getFeesReport(query);
  }

  @Get('attendance')
  getAttendanceReport(@Query() query: AdminReportsQueryDto) {
    return this.reportsService.getAttendanceReport(query);
  }

  @Get('courses')
  getCoursesReport(@Query() query: AdminReportsQueryDto) {
    return this.reportsService.getCoursesReport(query);
  }

  @Get('course-performance')
  getCoursePerformanceReport(@Query() query: AdminReportsQueryDto) {
    return this.reportsService.getCoursesReport(query);
  }
}
