import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import {
  Attendance,
  Batch,
  Certificate,
  Course,
  Enrollment,
  FeePlan,
  Lead,
  Payment,
  StudentProfile,
} from '../../database/entities';
import { AdminReportsQueryDto } from './dto/admin-reports-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Lead) private readonly leads: Repository<Lead>,
    @InjectRepository(StudentProfile) private readonly students: Repository<StudentProfile>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(FeePlan) private readonly feePlans: Repository<FeePlan>,
    @InjectRepository(Attendance) private readonly attendance: Repository<Attendance>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    @InjectRepository(Batch) private readonly batches: Repository<Batch>,
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(Certificate) private readonly certificates: Repository<Certificate>,
  ) {}

  async getReports(query: AdminReportsQueryDto) {
    const range = this.resolveRange(query);
    const [leads, students, payments, feePlans, attendance, courses, batches, enrollments, certificates] =
      await Promise.all([
        this.leads.find({ where: { createdAt: Between(range.from, range.to) } }),
        this.students.find({ where: { createdAt: Between(range.from, range.to) }, relations: { user: true } }),
        this.payments.find({
          where: { paymentDate: Between(this.dateKey(range.from), this.dateKey(range.to)) },
          relations: { enrollment: { course: true, batch: true }, student: { user: true } },
        }),
        this.feePlans.find({ relations: { enrollment: { course: true, batch: true, student: { user: true } } } }),
        this.attendance.find({
          where: { date: Between(this.dateKey(range.from), this.dateKey(range.to)) },
          relations: { course: true, batch: true, student: { user: true } },
        }),
        this.courses.find({ relations: { category: true } }),
        this.batches.find({ relations: { course: true } }),
        this.enrollments.find({ relations: { course: true, batch: true } }),
        this.certificates.find({ where: { createdAt: Between(range.from, range.to) } }),
      ]);

    const filteredPayments = this.filterByCourseAndBatch(payments, query);
    const filteredFees = this.filterByCourseAndBatch(feePlans, query, 'enrollment');
    const filteredAttendance = this.filterByCourseAndBatch(attendance, query);
    const filteredEnrollments = this.filterByCourseAndBatch(enrollments, query);
    const activeBatches = batches.filter((batch) => ['active', 'upcoming'].includes(batch.status));
    const verifiedPayments = filteredPayments.filter((payment) => payment.status === 'verified');
    const paidAmount = verifiedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const pendingAmount = filteredFees.reduce((sum, plan) => sum + Number(plan.pendingAmount), 0);
    const presentLike = filteredAttendance.filter((record) => ['present', 'late'].includes(record.status)).length;
    const averageAttendance = filteredAttendance.length ? Math.round((presentLike / filteredAttendance.length) * 100) : 0;

    return {
      filters: {
        dateFrom: this.dateKey(range.from),
        dateTo: this.dateKey(range.to),
        courseId: query.courseId ?? '',
        batchId: query.batchId ?? '',
        courses: courses.map((course) => ({ id: course.id, title: course.title })),
        batches: batches.map((batch) => ({ id: batch.id, title: batch.title, courseId: batch.course.id })),
      },
      overview: {
        leads: leads.length,
        newStudents: students.length,
        enrollments: filteredEnrollments.length,
        verifiedRevenue: paidAmount,
        pendingFees: pendingAmount,
        averageAttendance,
        certificatesIssued: certificates.filter((certificate) => certificate.status === 'issued').length,
        activeBatches: activeBatches.length,
      },
      admissions: {
        byStatus: this.countBy(leads, (lead) => lead.status, ['new', 'contacted', 'converted', 'rejected']),
        recentStudents: students.slice(0, 8).map((student) => ({
          id: student.id,
          name: student.user?.name ?? 'Student',
          email: student.user?.email ?? '',
          status: student.status,
          createdAt: student.createdAt,
        })),
      },
      fees: {
        totalPayable: filteredFees.reduce((sum, plan) => sum + Number(plan.payableAmount), 0),
        paidAmount,
        pendingAmount,
        verifiedPayments: verifiedPayments.length,
        pendingPayments: filteredPayments.filter((payment) => payment.status === 'pending').length,
        byMethod: this.countAmountsBy(filteredPayments, (payment) => payment.method),
      },
      attendance: {
        totalRecords: filteredAttendance.length,
        present: filteredAttendance.filter((record) => record.status === 'present').length,
        absent: filteredAttendance.filter((record) => record.status === 'absent').length,
        late: filteredAttendance.filter((record) => record.status === 'late').length,
        leave: filteredAttendance.filter((record) => record.status === 'leave').length,
        averageAttendance,
      },
      courses: courses.map((course) => {
        const courseEnrollments = enrollments.filter((enrollment) => enrollment.course.id === course.id);
        const courseBatches = batches.filter((batch) => batch.course.id === course.id);
        const coursePayments = payments.filter((payment) => payment.enrollment?.course?.id === course.id && payment.status === 'verified');
        return {
          id: course.id,
          title: course.title,
          category: course.category?.name ?? 'Uncategorized',
          isPublished: course.isPublished,
          enrollments: courseEnrollments.length,
          activeBatches: courseBatches.filter((batch) => batch.status === 'active').length,
          revenue: coursePayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
        };
      }),
    };
  }

  async getAdmissionsReport(query: AdminReportsQueryDto) {
    const report = await this.getReports(query);
    return {
      filters: report.filters,
      overview: {
        leads: report.overview.leads,
        newStudents: report.overview.newStudents,
        enrollments: report.overview.enrollments,
      },
      admissions: report.admissions,
    };
  }

  async getFeesReport(query: AdminReportsQueryDto) {
    const report = await this.getReports(query);
    return {
      filters: report.filters,
      overview: {
        verifiedRevenue: report.overview.verifiedRevenue,
        pendingFees: report.overview.pendingFees,
      },
      fees: report.fees,
    };
  }

  async getAttendanceReport(query: AdminReportsQueryDto) {
    const report = await this.getReports(query);
    return {
      filters: report.filters,
      overview: {
        averageAttendance: report.overview.averageAttendance,
        activeBatches: report.overview.activeBatches,
      },
      attendance: report.attendance,
    };
  }

  async getCoursesReport(query: AdminReportsQueryDto) {
    const report = await this.getReports(query);
    return {
      filters: report.filters,
      overview: {
        enrollments: report.overview.enrollments,
        certificatesIssued: report.overview.certificatesIssued,
        activeBatches: report.overview.activeBatches,
      },
      courses: report.courses,
    };
  }

  private resolveRange(query: AdminReportsQueryDto) {
    const to = query.dateTo ? new Date(query.dateTo) : new Date();
    const from = query.dateFrom ? new Date(query.dateFrom) : new Date(to.getFullYear(), to.getMonth(), 1);
    to.setHours(23, 59, 59, 999);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }

  private dateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private filterByCourseAndBatch<T extends { course?: Course; batch?: Batch; enrollment?: Enrollment }>(
    rows: T[],
    query: AdminReportsQueryDto,
    relation?: 'enrollment',
  ) {
    return rows.filter((row) => {
      const courseId = relation ? row.enrollment?.course?.id : row.course?.id ?? row.enrollment?.course?.id;
      const batchId = relation ? row.enrollment?.batch?.id : row.batch?.id ?? row.enrollment?.batch?.id;
      return (!query.courseId || courseId === query.courseId) && (!query.batchId || batchId === query.batchId);
    });
  }

  private countBy<T>(rows: T[], getKey: (row: T) => string, keys: string[]) {
    return Object.fromEntries(keys.map((item) => [item, rows.filter((row) => getKey(row) === item).length]));
  }

  private countAmountsBy<T extends { amount: unknown }>(rows: T[], getKey: (row: T) => string) {
    return rows.reduce<Record<string, { count: number; amount: number }>>((acc, row) => {
      const name = getKey(row) || 'other';
      acc[name] = acc[name] ?? { count: 0, amount: 0 };
      acc[name].count += 1;
      acc[name].amount += Number(row.amount ?? 0);
      return acc;
    }, {});
  }
}
