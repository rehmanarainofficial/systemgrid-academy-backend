import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
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

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly students: Repository<StudentProfile>,
    @InjectRepository(Lead)
    private readonly leads: Repository<Lead>,
    @InjectRepository(Course)
    private readonly courses: Repository<Course>,
    @InjectRepository(Batch)
    private readonly batches: Repository<Batch>,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(FeePlan)
    private readonly feePlans: Repository<FeePlan>,
    @InjectRepository(Attendance)
    private readonly attendance: Repository<Attendance>,
    @InjectRepository(Certificate)
    private readonly certificates: Repository<Certificate>,
    @InjectRepository(Enrollment)
    private readonly enrollments: Repository<Enrollment>,
  ) {}

  async getStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = now.toISOString().slice(0, 10);

    const [
      totalStudents,
      activeStudents,
      activeCourses,
      activeBatches,
      leadRows,
      allPayments,
      pendingFeePlans,
      attendanceRows,
      certificatesIssued,
      growthStudents,
      recentLeads,
      recentStudents,
      upcomingBatches,
    ] = await Promise.all([
      this.students.count(),
      this.students.count({ where: { status: 'active' } }),
      this.courses.count({ where: { isPublished: true } }),
      this.batches.count({ where: { status: In(['upcoming', 'active']) } }),
      this.leads
        .createQueryBuilder('lead')
        .select('lead.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('lead.status')
        .getRawMany<{ status: string; count: string }>(),
      this.payments.find({ where: { status: 'verified' } }),
      this.feePlans.find({ select: { pendingAmount: true } }),
      this.attendance.find(),
      this.certificates.count({ where: { status: 'issued' } }),
      this.students.find({ select: { id: true, createdAt: true } }),
      this.leads.find({ order: { createdAt: 'DESC' }, take: 5 }),
      this.students.find({
        relations: { user: true, enrollments: { course: true } },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
      this.batches.find({
        where: {
          startDate: MoreThanOrEqual(today),
          status: In(['upcoming', 'active']),
        },
        relations: { course: true },
        order: { startDate: 'ASC' },
        take: 5,
      }),
    ]);

    const leadCounts = Object.fromEntries(
      leadRows.map((item) => [item.status, Number(item.count)]),
    );
    const totalLeads = Object.values(leadCounts).reduce((sum, value) => sum + value, 0);
    const attended = attendanceRows.filter((item) => ['present', 'late'].includes(item.status)).length;
    const months = this.getLastSixMonths(now);
    const enrollmentCounts = upcomingBatches.length
      ? await this.enrollments
          .createQueryBuilder('enrollment')
          .leftJoin('enrollment.batch', 'batch')
          .select('batch.id', 'batchId')
          .addSelect('COUNT(*)', 'count')
          .where('batch.id IN (:...ids)', {
            ids: upcomingBatches.map((batch) => batch.id),
          })
          .groupBy('batch.id')
          .getRawMany<{ batchId: string; count: string }>()
      : [];
    const batchCounts = Object.fromEntries(
      enrollmentCounts.map((item) => [item.batchId, Number(item.count)]),
    );

    return {
      overview: {
        totalStudents,
        activeStudents,
        newLeads: leadCounts.new ?? 0,
        convertedLeads: leadCounts.converted ?? 0,
        activeCourses,
        activeBatches,
        monthlyRevenue: allPayments
          .filter((payment) => new Date(payment.paymentDate) >= monthStart)
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
        pendingFees: pendingFeePlans.reduce((sum, plan) => sum + Number(plan.pendingAmount ?? 0), 0),
        averageAttendance: attendanceRows.length
          ? Math.round((attended / attendanceRows.length) * 100)
          : 0,
        certificatesIssued,
      },
      leadStats: {
        total: totalLeads,
        new: leadCounts.new ?? 0,
        contacted: leadCounts.contacted ?? 0,
        converted: leadCounts.converted ?? 0,
        rejected: leadCounts.rejected ?? 0,
      },
      studentGrowth: months.map((month) => ({
        month: month.label,
        students: growthStudents.filter(
          (student) => this.monthKey(student.createdAt) === month.key,
        ).length,
      })),
      revenueOverview: months.map((month) => ({
        month: month.label,
        amount: allPayments
          .filter((payment) => this.monthKey(new Date(payment.paymentDate)) === month.key)
          .reduce((sum, payment) => sum + Number(payment.amount), 0),
      })),
      recentLeads: recentLeads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        courseInterest: lead.courseInterest ?? 'Course guidance',
        status: lead.status,
        createdAt: lead.createdAt,
      })),
      recentStudents: recentStudents.map((student) => ({
        id: student.id,
        name: student.user?.name ?? 'Unknown student',
        email: student.user?.email ?? '',
        courseTitle:
          student.enrollments?.find((enrollment) => enrollment.status === 'active')?.course?.title ??
          'Not enrolled',
        status: student.status,
        createdAt: student.createdAt,
      })),
      upcomingBatches: upcomingBatches.map((batch) => ({
        id: batch.id,
        title: batch.title,
        courseTitle: batch.course?.title ?? 'Unknown course',
        startDate: batch.startDate,
        mode: batch.mode,
        studentsCount: batchCounts[batch.id] ?? 0,
        capacity: batch.capacity,
      })),
    };
  }

  private getLastSixMonths(date: Date) {
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(date.getFullYear(), date.getMonth() - (5 - index), 1);
      return {
        key: this.monthKey(month),
        label: month.toLocaleString('en', { month: 'short' }),
      };
    });
  }

  private monthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
