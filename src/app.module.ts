import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BatchesModule } from './modules/batches/batches.module';
import { ClassRecordingsModule } from './modules/class-recordings/class-recordings.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { FeesModule } from './modules/fees/fees.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { InstructorsModule } from './modules/instructors/instructors.module';
import { LeadsModule } from './modules/leads/leads.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { StudentPortalModule } from './modules/student-portal/student-portal.module';
import { InstructorPortalModule } from './modules/instructor-portal/instructor-portal.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { LearningPathsModule } from './modules/learning-paths/learning-paths.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AccessControlModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    CoursesModule,
    CategoriesModule,
    BatchesModule,
    ClassRecordingsModule,
    EnrollmentsModule,
    AttendanceModule,
    AssignmentsModule,
    SubmissionsModule,
    FeesModule,
    PaymentsModule,
    InvoicesModule,
    CertificatesModule,
    InstructorsModule,
    LeadsModule,
    NotificationsModule,
    UploadsModule,
    ReportsModule,
    SettingsModule,
    AuditLogsModule,
    StudentPortalModule,
    InstructorPortalModule,
    AdminDashboardModule,
    BlogsModule,
    AdmissionsModule,
    LearningPathsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
