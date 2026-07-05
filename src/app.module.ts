import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BatchesModule } from './modules/batches/batches.module';
import { LessonsModule } from './modules/lessons/lessons.module';
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
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    CoursesModule,
    CategoriesModule,
    BatchesModule,
    LessonsModule,
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
    AdminDashboardModule,
    BlogsModule,
    AdmissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
