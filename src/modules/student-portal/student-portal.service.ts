import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import {
  Attendance,
  Assignment,
  AssignmentSubmission,
  ClassSchedule,
  Certificate,
  CourseModule,
  CourseResource,
  Enrollment,
  FeePlan,
  Invoice,
  Lesson,
  Notification,
  Payment,
  ReferralCode,
  ReferralRedemption,
  StudentProfile,
  StudentWallet,
  User,
  WalletLedger,
} from '../../database/entities';
import { ChangeStudentPasswordDto } from './dto/change-student-password.dto';
import { SubmitStudentFeePaymentDto } from './dto/submit-student-fee-payment.dto';
import { StudentNotificationsQueryDto } from './dto/student-notifications-query.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import type { UploadedFileData } from '../uploads/uploads.service';
import { UploadsService } from '../uploads/uploads.service';
import { AdminAlertsService } from '../notifications/admin-alerts.service';

const dayIndexes: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

@Injectable()
export class StudentPortalService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly studentsRepository: Repository<StudentProfile>,
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(ClassSchedule)
    private readonly schedulesRepository: Repository<ClassSchedule>,
    @InjectRepository(Lesson)
    private readonly lessonsRepository: Repository<Lesson>,
    @InjectRepository(CourseModule)
    private readonly modulesRepository: Repository<CourseModule>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Assignment)
    private readonly assignmentsRepository: Repository<Assignment>,
    @InjectRepository(AssignmentSubmission)
    private readonly submissionsRepository: Repository<AssignmentSubmission>,
    @InjectRepository(FeePlan)
    private readonly feePlansRepository: Repository<FeePlan>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(Certificate)
    private readonly certificatesRepository: Repository<Certificate>,
    @InjectRepository(CourseResource)
    private readonly resourcesRepository: Repository<CourseResource>,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(StudentWallet)
    private readonly walletsRepository: Repository<StudentWallet>,
    @InjectRepository(WalletLedger)
    private readonly walletLedgerRepository: Repository<WalletLedger>,
    @InjectRepository(ReferralCode)
    private readonly referralCodesRepository: Repository<ReferralCode>,
    @InjectRepository(ReferralRedemption)
    private readonly referralRedemptionsRepository: Repository<ReferralRedemption>,
    private readonly dataSource: DataSource,
    private readonly uploadsService: UploadsService,
    private readonly adminAlertsService: AdminAlertsService,
  ) {}

  async getDashboard(userId: string) {
    const student = await this.getStudentProfile(userId);
    const enrollments = await this.getStudentEnrollments(student.id);
    const activeEnrollments = enrollments.filter((item) => item.status === 'active');
    const completedEnrollments = enrollments.filter((item) => item.status === 'completed');
    const currentEnrollment = activeEnrollments[0] ?? enrollments[0];

    const attendanceRecords = await this.attendanceRepository.find({
      where: { student: { id: student.id } },
    });
    const attendanceSummary = this.buildAttendanceSummary(attendanceRecords);
    const feeStatus = await this.buildFeeStatus(enrollments);
    const currentCourse = currentEnrollment
      ? await this.buildCurrentCourse(currentEnrollment)
      : null;
    const recentLessons = currentEnrollment
      ? await this.buildRecentLessons(currentEnrollment)
      : [];

    return {
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone ?? '',
        city: student.city ?? '',
      },
      overview: {
        totalEnrolledCourses: enrollments.length,
        activeCourses: activeEnrollments.length,
        completedCourses: completedEnrollments.length,
        overallProgress: this.averageProgress(enrollments),
        attendancePercentage: attendanceSummary.percentage,
        pendingFee: feeStatus.pendingAmount,
        paidFee: feeStatus.paidAmount,
      },
      currentCourse,
      upcomingClass: currentEnrollment
        ? await this.buildUpcomingClass(currentEnrollment)
        : null,
      recentLessons,
      feeStatus,
      attendanceSummary: {
        present: attendanceSummary.present,
        absent: attendanceSummary.absent,
        late: attendanceSummary.late,
        leave: attendanceSummary.leave,
      },
    };
  }

  async getSchedule(userId: string) {
    const student = await this.getStudentProfile(userId);
    const enrollments = await this.getStudentEnrollments(student.id);
    const batchIds = enrollments
      .map((enrollment) => enrollment.batch?.id)
      .filter((id): id is string => Boolean(id));

    if (!batchIds.length) {
      return { upcomingClasses: [], weeklySchedule: this.emptyWeeklySchedule() };
    }

    const schedules = await this.schedulesRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.batch', 'batch')
      .leftJoinAndSelect('schedule.course', 'course')
      .leftJoinAndSelect('schedule.lesson', 'lesson')
      .leftJoinAndSelect('lesson.module', 'module')
      .where('batch.id IN (:...batchIds)', { batchIds })
      .orderBy('schedule.date', 'ASC')
      .addOrderBy('schedule.startTime', 'ASC')
      .getMany();

    const upcomingClasses = schedules
      .filter((schedule) => schedule.status === 'upcoming')
      .map((schedule) => this.mapSchedule(schedule));

    return {
      upcomingClasses,
      weeklySchedule: this.buildWeeklySchedule(enrollments),
    };
  }

  async getAttendance(userId: string) {
    const student = await this.getStudentProfile(userId);
    const records = await this.attendanceRepository.find({
      where: { student: { id: student.id } },
      relations: { batch: true, course: true },
      order: { date: 'DESC' },
    });
    const summary = this.buildAttendanceSummary(records);

    return {
      summary: {
        attendancePercentage: summary.percentage,
        totalClasses: records.length,
        present: summary.present,
        absent: summary.absent,
        late: summary.late,
        leave: summary.leave,
      },
      records: records.map((record) => ({
        id: record.id,
        courseTitle: record.course?.title ?? record.batch?.course?.title ?? 'Class',
        batchTitle: record.batch?.title ?? 'Batch',
        date: record.date,
        status: record.status,
        remarks: record.remarks ?? '',
      })),
    };
  }

  async getAssignments(userId: string) {
    const { student, assignments, submissions } =
      await this.getStudentAssignmentsContext(userId);
    const submissionsByAssignment = new Map(
      submissions.map((submission) => [submission.assignment.id, submission]),
    );
    const mappedAssignments = assignments.map((assignment) => {
      const submission = submissionsByAssignment.get(assignment.id);
      return this.mapAssignmentListItem(assignment, submission);
    });

    return {
      summary: {
        total: mappedAssignments.length,
        pending: mappedAssignments.filter((item) => item.status === 'pending').length,
        submitted: mappedAssignments.filter((item) => item.status === 'submitted').length,
        checked: mappedAssignments.filter((item) => item.status === 'checked').length,
        late: mappedAssignments.filter((item) => item.status === 'late').length,
      },
      assignments: mappedAssignments,
      studentId: student.id,
    };
  }

  async getAssignmentDetail(userId: string, assignmentId: string) {
    const { student, assignments, submissions } =
      await this.getStudentAssignmentsContext(userId);
    const assignment = assignments.find((item) => item.id === assignmentId);

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const submission = submissions.find(
      (item) => item.assignment.id === assignment.id && item.student.id === student.id,
    );
    const status = this.assignmentStatus(assignment, submission);

    return {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description ?? '',
        courseTitle: assignment.course.title,
        moduleTitle: assignment.module?.title ?? 'Course module',
        dueDate: assignment.dueDate?.toISOString() ?? null,
        totalMarks: assignment.totalMarks,
        attachmentUrl: assignment.attachmentUrl ?? '',
        status,
        submittedAt: submission?.submittedAt?.toISOString() ?? null,
        marksObtained: submission?.marksObtained ?? null,
        feedback: submission?.feedback ?? null,
        checkedAt: submission?.checkedAt?.toISOString() ?? null,
      },
      submission: submission
        ? {
            id: submission.id,
            textAnswer: submission.textAnswer ?? '',
            fileUrl: submission.fileUrl ?? '',
            status: submission.status,
            submittedAt: submission.submittedAt?.toISOString() ?? null,
            checkedAt: submission.checkedAt?.toISOString() ?? null,
          }
        : {
            id: null,
            textAnswer: '',
            fileUrl: '',
            status: 'not_submitted',
          },
    };
  }

  async submitAssignment(
    userId: string,
    assignmentId: string,
    dto: SubmitAssignmentDto,
  ) {
    if (!dto.textAnswer?.trim() && !dto.fileUrl?.trim()) {
      throw new BadRequestException('Please add your answer or upload/link your file.');
    }

    const { student, assignments, submissions } =
      await this.getStudentAssignmentsContext(userId);
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const existingSubmission = submissions.find(
      (submission) => submission.assignment.id === assignment.id,
    );
    if (existingSubmission?.status === 'checked') {
      throw new ForbiddenException('Checked assignments cannot be resubmitted.');
    }

    const status = this.isAssignmentLate(assignment) ? 'late' : 'submitted';
    const submission = existingSubmission
      ? this.submissionsRepository.merge(existingSubmission, {
          textAnswer: dto.textAnswer?.trim() ?? existingSubmission.textAnswer,
          fileUrl: dto.fileUrl?.trim() ?? existingSubmission.fileUrl,
          status,
          submittedAt: new Date(),
        })
      : this.submissionsRepository.create({
          assignment,
          student,
          textAnswer: dto.textAnswer?.trim(),
          fileUrl: dto.fileUrl?.trim(),
          status,
        });

    const savedSubmission = await this.submissionsRepository.save(submission);

    return {
      message: 'Assignment submitted successfully',
      submission: {
        id: savedSubmission.id,
        status: savedSubmission.status,
        submittedAt: savedSubmission.submittedAt,
      },
    };
  }

  async getPayments(userId: string) {
    const student = await this.getStudentProfile(userId);
    const enrollments = await this.getStudentEnrollments(student.id);
    const enrollmentIds = enrollments.map((item) => item.id);

    if (!enrollmentIds.length) {
      return {
        summary: {
          totalPayable: 0,
          paidAmount: 0,
          pendingAmount: 0,
          discountAmount: 0,
          status: 'paid',
        },
        feePlans: [],
        payments: [],
        invoices: [],
      };
    }

    const feePlans = await this.feePlansRepository
      .createQueryBuilder('feePlan')
      .leftJoinAndSelect('feePlan.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('enrollment.batch', 'batch')
      .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
      .getMany();

    const payments = await this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('payment.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('payment.invoiceRecord', 'invoiceRecord')
      .where('student.id = :studentId', { studentId: student.id })
      .andWhere('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
      .orderBy('payment.paymentDate', 'DESC')
      .getMany();

    const paymentIds = payments.map((payment) => payment.id);
    const linkedInvoices = paymentIds.length
      ? await this.invoicesRepository
          .createQueryBuilder('invoice')
          .leftJoinAndSelect('invoice.payment', 'payment')
          .leftJoinAndSelect('payment.enrollment', 'paymentEnrollment')
          .leftJoinAndSelect('paymentEnrollment.course', 'paymentCourse')
          .leftJoinAndSelect('invoice.enrollment', 'enrollment')
          .leftJoinAndSelect('enrollment.course', 'course')
          .leftJoinAndSelect('invoice.admissionApplication', 'application')
          .leftJoinAndSelect('application.course', 'applicationCourse')
          .where('payment.id IN (:...paymentIds)', { paymentIds })
          .getMany()
      : [];

    const studentInvoices = await this.invoicesRepository.find({
      where: { student: { id: student.id } },
      relations: {
        payment: { enrollment: { course: true } },
        enrollment: { course: true },
        admissionApplication: { course: true },
      },
      order: { issuedAt: 'DESC' },
    });

    const invoiceMap = new Map<string, Invoice>();
    for (const invoice of [...linkedInvoices, ...studentInvoices, ...payments.map((p) => p.invoiceRecord).filter(Boolean) as Invoice[]]) {
      if (!invoice) continue;
      if (invoice.payment?.id) invoiceMap.set(invoice.payment.id, invoice);
    }
    for (const payment of payments) {
      if (payment.invoiceRecord) invoiceMap.set(payment.id, payment.invoiceRecord);
    }
    const invoiceById = new Map<string, Invoice>();
    for (const invoice of [...invoiceMap.values(), ...studentInvoices]) {
      invoiceById.set(invoice.id, invoice);
    }
    const invoices = Array.from(invoiceById.values());

    const totalPayable = feePlans.reduce(
      (sum, item) => sum + Number(item.payableAmount ?? 0),
      0,
    );
    const paidAmount = feePlans.reduce(
      (sum, item) => sum + Number(item.paidAmount ?? 0),
      0,
    );
    const pendingAmount = feePlans.reduce(
      (sum, item) => sum + Number(item.pendingAmount ?? 0),
      0,
    );
    const discountAmount = feePlans.reduce(
      (sum, item) => sum + Number(item.discountAmount ?? 0),
      0,
    );

    return {
      summary: {
        totalPayable,
        paidAmount,
        pendingAmount,
        discountAmount,
        status: pendingAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      },
      feePlans: feePlans.map((plan) => ({
        id: plan.id,
        courseTitle: plan.enrollment.course.title,
        batchTitle: plan.enrollment.batch?.title ?? 'Self-paced',
        totalAmount: Number(plan.totalAmount),
        discountAmount: Number(plan.discountAmount),
        referralCouponDiscountAmount: Number(plan.referralCouponDiscountAmount ?? 0),
        scholarshipDiscountAmount: Number(plan.scholarshipDiscountAmount ?? 0),
        walletCreditUsed: Number(plan.walletCreditUsed ?? 0),
        payableAmount: Number(plan.payableAmount),
        paidAmount: Number(plan.paidAmount),
        pendingAmount: Number(plan.pendingAmount),
        status: plan.status,
        installmentType: plan.installmentType,
        dueDate: plan.dueDate ?? null,
      })),
      payments: payments.map((payment) => {
        const invoice = invoiceMap.get(payment.id);
        return {
          id: payment.id,
          invoiceId: invoice?.id ?? payment.invoiceRecord?.id ?? null,
          invoiceNumber: invoice?.invoiceNumber ?? payment.invoiceRecord?.invoiceNumber ?? '',
          courseTitle: payment.enrollment.course.title,
          amount: Number(payment.amount),
          method: payment.method,
          paymentDate: payment.paymentDate,
          status: payment.status,
          notes: payment.notes ?? '',
        };
      }),
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        courseTitle: this.resolveInvoiceCourseTitle(invoice),
        amount: Number(invoice.amount),
        grossAmount: Number(invoice.grossAmount ?? invoice.amount),
        planDiscountAmount: Number(invoice.planDiscountAmount ?? 0),
        referralCouponDiscountAmount: Number(invoice.referralCouponDiscountAmount ?? 0),
        scholarshipDiscountAmount: Number(invoice.scholarshipDiscountAmount ?? 0),
        walletCreditUsed: Number(invoice.walletCreditUsed ?? 0),
        payableAmount: Number(invoice.payableAmount ?? invoice.amount),
        paidAmount: Number(invoice.paidAmount ?? 0),
        pendingAmount: Number(invoice.pendingAmount ?? 0),
        issuedAt: invoice.issuedAt.toISOString(),
        status: invoice.status,
        pdfUrl: invoice.pdfUrl ?? '',
      })),
    };
  }

  async getWallet(userId: string) {
    const student = await this.getStudentProfile(userId);
    const wallet = await this.walletsRepository.findOne({ where: { student: { id: student.id } } });
    const ledger = await this.walletLedgerRepository.find({
      where: { student: { id: student.id } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return {
      summary: {
        availableBalance: Number(wallet?.balance ?? 0),
        totalEarned: Number(wallet?.totalEarned ?? 0),
        totalUsed: Number(wallet?.totalUsed ?? 0),
      },
      ledger: ledger.map((item) => ({
        id: item.id,
        type: item.type,
        source: item.source,
        amount: Number(item.amount),
        balanceAfter: Number(item.balanceAfter),
        referenceId: item.referenceId ?? '',
        description: item.description ?? '',
        createdAt: item.createdAt,
      })),
    };
  }

  async getReferrals(userId: string) {
    const student = await this.getStudentProfile(userId);
    const referralCode = await this.referralCodesRepository.findOne({
      where: { student: { id: student.id }, isActive: true },
      order: { createdAt: 'DESC' },
    });
    const redemptions = await this.referralRedemptionsRepository.find({
      where: { referrerStudent: { id: student.id } },
      relations: { referredApplication: true, referredStudent: { user: true } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    const wallet = await this.walletsRepository.findOne({ where: { student: { id: student.id } } });
    return {
      code: referralCode?.code ?? '',
      availableWalletBalance: Number(wallet?.balance ?? 0),
      totalReferrals: redemptions.length,
      pendingReferrals: redemptions.filter((item) => item.status !== 'verified').length,
      verifiedReferrals: redemptions.filter((item) => item.status === 'verified').length,
      totalCreditEarned: Number(referralCode?.totalCreditEarned ?? 0),
      history: redemptions.map((item) => ({
        id: item.id,
        friendName: item.referredStudent?.user?.name ?? item.referredApplication.name ?? item.referredApplication.email,
        status: item.status,
        creditAmount: Number(item.referrerCreditAmount),
        createdAt: item.createdAt,
        verifiedAt: item.verifiedAt ?? null,
      })),
    };
  }

  async getCertificates(userId: string) {
    const student = await this.getStudentProfile(userId);
    const certificates = await this.certificatesRepository.find({
      where: { student: { id: student.id } },
      relations: { student: { user: true }, course: true, enrollment: true },
      order: { issueDate: 'DESC' },
    });
    const eligibility = await this.buildCertificateEligibility(student);
    const issued = certificates.filter((item) => item.status === 'issued').length;
    const eligible = eligibility.filter((item) => item.eligible).length;

    return {
      summary: {
        totalCertificates: certificates.length,
        issued,
        eligible,
        inProgress: eligibility.filter((item) => !item.eligible).length,
      },
      certificates: certificates.map((certificate) =>
        this.mapCertificateListItem(certificate),
      ),
      eligibility,
    };
  }

  async getCertificateDetail(userId: string, certificateId: string) {
    const student = await this.getStudentProfile(userId);
    const certificate = await this.certificatesRepository.findOne({
      where: { id: certificateId, student: { id: student.id } },
      relations: {
        student: { user: true },
        course: true,
        enrollment: { course: true },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return {
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.student.user.name,
        courseTitle: certificate.course.title,
        issueDate: certificate.issueDate,
        status: certificate.status,
        verificationCode: certificate.verificationCode,
        pdfUrl: certificate.pdfUrl ?? '',
        academyName: 'SystemGrid Academy',
        description:
          'This certificate is awarded for successfully completing the course requirements, assignments, and final project work.',
      },
      course: {
        title: certificate.course.title,
        duration: this.formatDuration(
          certificate.course.duration,
          certificate.course.durationUnit,
        ),
        mode: this.formatMode(certificate.course.mode),
      },
      student: {
        name: certificate.student.user.name,
        email: certificate.student.user.email,
      },
    };
  }

  async verifyPublicCertificate(verificationCode: string) {
    const certificate = await this.certificatesRepository.findOne({
      where: { verificationCode, status: 'issued' },
      relations: { student: { user: true }, course: true },
    });

    if (!certificate) {
      return { valid: false, certificate: null };
    }

    return {
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.student.user.name,
        courseTitle: certificate.course.title,
        issueDate: certificate.issueDate,
        academyName: 'SystemGrid Academy',
        status: certificate.status,
      },
    };
  }

  async getNotifications(userId: string, query: StudentNotificationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const notificationsQuery = this.notificationsRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user')
      .where('user.id = :userId', { userId });

    if (query.status === 'unread') {
      notificationsQuery.andWhere('notification.isRead = false');
    }
    if (query.status === 'read') {
      notificationsQuery.andWhere('notification.isRead = true');
    }
    if (query.type && query.type !== 'all') {
      notificationsQuery.andWhere('notification.type = :type', { type: query.type });
    }
    if (query.search?.trim()) {
      notificationsQuery.andWhere(
        '(LOWER(notification.title) LIKE :search OR LOWER(notification.message) LIKE :search)',
        { search: `%${query.search.trim().toLowerCase()}%` },
      );
    }

    const [notifications, totalItems] = await notificationsQuery
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const summaryItems = await this.notificationsRepository.find({
      where: { user: { id: userId } },
    });

    return {
      summary: {
        total: summaryItems.length,
        unread: summaryItems.filter((item) => !item.isRead).length,
        read: summaryItems.filter((item) => item.isRead).length,
        feeReminders: summaryItems.filter((item) => item.type === 'fee').length,
        classUpdates: summaryItems.filter((item) => item.type === 'class').length,
        assignments: summaryItems.filter((item) => item.type === 'assignment').length,
      },
      notifications: notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
        actionUrl: notification.actionUrl ?? '',
      })),
      pagination: {
        page,
        limit,
        totalPages: Math.max(Math.ceil(totalItems / limit), 1),
        totalItems,
      },
    };
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
      relations: { user: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await this.notificationsRepository.save(notification);
    }

    return { message: 'Notification marked as read' };
  }

  async markAllNotificationsAsRead(userId: string) {
    await this.notificationsRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('"userId" = :userId', { userId })
      .execute();

    return { message: 'All notifications marked as read' };
  }

  async getNotificationCount(userId: string) {
    const unreadCount = await this.notificationsRepository.count({
      where: { 
        user: { id: userId },
        isRead: false 
      }
    });
    return { unreadCount };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
      relations: { user: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationsRepository.remove(notification);
    return { message: 'Notification deleted' };
  }

  async getProfile(userId: string) {
    const student = await this.getStudentProfile(userId);
    const enrollments = await this.getStudentEnrollments(student.id);
    const attendanceRecords = await this.attendanceRepository.find({
      where: { student: { id: student.id } },
    });
    const attendanceSummary = this.buildAttendanceSummary(attendanceRecords);
    const certificateCount = await this.certificatesRepository.count({
      where: { student: { id: student.id }, status: 'issued' },
    });

    return {
      user: this.mapSafeUser(student.user),
      profile: {
        id: student.id,
        phone: student.user.phone ?? '',
        guardianName: student.guardianName ?? '',
        guardianPhone: student.guardianPhone ?? '',
        city: student.city ?? '',
        address: student.address ?? '',
        dateOfBirth: student.dateOfBirth ?? '',
        gender: student.gender ?? '',
        educationLevel: student.educationLevel ?? '',
        courseInterest: student.courseInterest ?? '',
        preferredMode: student.preferredMode ?? '',
        preferredTiming: student.preferredTiming ?? '',
        preferredDays: student.preferredDays ?? '',
        admissionMessage: student.admissionMessage ?? '',
        source: student.source ?? 'website',
      },
      stats: {
        enrolledCourses: enrollments.length,
        completedCourses: enrollments.filter((item) => item.status === 'completed').length,
        attendancePercentage: attendanceSummary.percentage,
        certificates: certificateCount,
      },
    };
  }

  async updateProfile(
    _userId: string,
    _dto: UpdateStudentProfileDto,
  ): Promise<never> {
    throw new ForbiddenException(
      'Admission profile details are read-only. Contact academy support to request a correction.',
    );
  }

  async changePassword(userId: string, dto: ChangeStudentPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Confirm password must match new password.');
    }

    const hasStrongPassword =
      /[a-z]/.test(dto.newPassword) &&
      /[A-Z]/.test(dto.newPassword) &&
      /\d/.test(dto.newPassword) &&
      /[^A-Za-z0-9]/.test(dto.newPassword);
    if (!hasStrongPassword) {
      throw new BadRequestException(
        'New password must include uppercase, lowercase, number, and special character.',
      );
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.usersRepository.save(user);
    
    // Update password last changed timestamp
    await this.studentsRepository.update(
      { user: { id: userId } },
      { passwordLastChanged: new Date() }
    );

    return { message: 'Password changed successfully' };
  }

  async getMyCourses(userId: string) {
    const student = await this.getStudentProfile(userId);
    const enrollments = await this.getStudentEnrollments(student.id);

    const courses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const lessons = await this.getPublishedLessons(enrollment.course.id);
        const completedLessons = this.completedLessonCount(
          lessons.length,
          Number(enrollment.progressPercentage),
        );
        const nextLesson = lessons[completedLessons]?.title ?? lessons.at(-1)?.title ?? '';

        return {
          enrollmentId: enrollment.id,
          courseId: enrollment.course.id,
          title: enrollment.course.title,
          slug: enrollment.course.slug,
          shortDescription: enrollment.course.shortDescription,
          thumbnail: enrollment.course.thumbnail ?? '',
          level: this.formatLevel(enrollment.course.level),
          duration: this.formatDuration(
            enrollment.course.duration,
            enrollment.course.durationUnit,
          ),
          mode: this.formatMode(enrollment.course.mode),
          batchTitle: enrollment.batch?.title ?? 'Self-paced',
          batchCode: enrollment.batch?.code ?? 'SG-SELF',
          status: enrollment.status,
          progressPercentage: Number(enrollment.progressPercentage),
          totalLessons: lessons.length,
          completedLessons,
          nextLesson,
        };
      }),
    );

    return { courses };
  }

  async getCourseDetail(userId: string, courseId: string) {
    const student = await this.getStudentProfile(userId);
    const enrollments = await this.getStudentEnrollments(student.id);
    const enrollment = enrollments.find(
      (item) => item.course.id === courseId || item.course.slug === courseId,
    );

    if (!enrollment) {
      throw new NotFoundException('Student course enrollment not found');
    }

    const modules = await this.modulesRepository.find({
      where: { course: { id: enrollment.course.id } },
      order: { sortOrder: 'ASC' },
    });
    const lessons = await this.getPublishedLessons(enrollment.course.id);
    const completedLessons = this.completedLessonCount(
      lessons.length,
      Number(enrollment.progressPercentage),
    );
    const resources = await this.resourcesRepository.find({
      where: { course: { id: enrollment.course.id } },
      order: { createdAt: 'DESC' },
    });

    return {
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        shortDescription: enrollment.course.shortDescription,
        level: this.formatLevel(enrollment.course.level),
        duration: this.formatDuration(
          enrollment.course.duration,
          enrollment.course.durationUnit,
        ),
        mode: this.formatMode(enrollment.course.mode),
        status: enrollment.status,
        progressPercentage: Number(enrollment.progressPercentage),
        completedLessons,
        remainingLessons: Math.max(lessons.length - completedLessons, 0),
        totalLessons: lessons.length,
        currentModule:
          modules.find((module) =>
            lessons
              .slice(completedLessons, completedLessons + 1)
              .some((lesson) => lesson.module?.id === module.id),
          )?.title ?? modules.at(-1)?.title ?? '',
      },
      batch: enrollment.batch
        ? {
            title: enrollment.batch.title,
            code: enrollment.batch.code,
            classDays: enrollment.batch.classDays,
            startTime: enrollment.batch.startTime ?? '',
            endTime: enrollment.batch.endTime ?? '',
            mode: this.formatMode(enrollment.batch.mode),
          }
        : null,
      modules: modules.map((module) => {
        const moduleLessons = lessons.filter(
          (lesson) => lesson.module?.id === module.id,
        );
        const moduleCompleted = moduleLessons.filter((lesson) => {
          const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
          return lessonIndex >= 0 && lessonIndex < completedLessons;
        }).length;

        return {
          id: module.id,
          title: module.title,
          description: module.description ?? '',
          sortOrder: module.sortOrder,
          progressPercentage: moduleLessons.length
            ? Math.round((moduleCompleted / moduleLessons.length) * 100)
            : 0,
          lessons: moduleLessons.map((lesson) => {
            const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
            const completed = lessonIndex >= 0 && lessonIndex < completedLessons;
            return {
              id: lesson.id,
              title: lesson.title,
              description: lesson.description ?? '',
              durationMinutes: lesson.durationMinutes ?? 0,
              videoUrl: lesson.videoUrl ?? '',
              resourceUrl: lesson.resourceUrl ?? '',
              completed,
              locked: lessonIndex > completedLessons,
            };
          }),
        };
      }),
      resources: resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        url: resource.url,
      })),
    };
  }

  private async getStudentProfile(userId: string) {
    const student = await this.studentsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return student;
  }

  private mapSafeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? '',
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private getStudentEnrollments(studentId: string) {
    return this.enrollmentsRepository.find({
      where: { student: { id: studentId } },
      relations: { batch: true, course: true, student: true },
      order: { enrolledAt: 'DESC' },
    });
  }

  private async getStudentAssignmentsContext(userId: string) {
    const student = await this.getStudentProfile(userId);
    const enrollments = await this.getStudentEnrollments(student.id);
    const courseIds = enrollments.map((item) => item.course.id);
    const batchIds = enrollments
      .map((item) => item.batch?.id)
      .filter((id): id is string => Boolean(id));

    if (!courseIds.length) {
      return { student, assignments: [], submissions: [] };
    }

    const assignmentsQuery = this.assignmentsRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.course', 'course')
      .leftJoinAndSelect('assignment.batch', 'batch')
      .leftJoinAndSelect('assignment.module', 'module')
      .where('assignment.isPublished = :isPublished', { isPublished: true })
      .andWhere('course.id IN (:...courseIds)', { courseIds });

    if (batchIds.length) {
      assignmentsQuery.andWhere('(batch.id IS NULL OR batch.id IN (:...batchIds))', {
        batchIds,
      });
    } else {
      assignmentsQuery.andWhere('batch.id IS NULL');
    }

    const assignments = await assignmentsQuery
      .orderBy('assignment.dueDate', 'ASC')
      .getMany();

    const assignmentIds = assignments.map((assignment) => assignment.id);
    const submissions = assignmentIds.length
      ? await this.submissionsRepository
          .createQueryBuilder('submission')
          .leftJoinAndSelect('submission.assignment', 'assignment')
          .leftJoinAndSelect('submission.student', 'student')
          .where('student.id = :studentId', { studentId: student.id })
          .andWhere('assignment.id IN (:...assignmentIds)', { assignmentIds })
          .getMany()
      : [];

    return { student, assignments, submissions };
  }

  private mapSchedule(schedule: ClassSchedule) {
    return {
      id: schedule.id,
      courseTitle: schedule.course.title,
      batchTitle: schedule.batch.title,
      batchCode: schedule.batch.code,
      moduleTitle: schedule.lesson?.module?.title ?? 'Course module',
      lessonTitle: schedule.lesson?.title ?? 'Class session',
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      mode: this.formatMode(schedule.mode),
      status: schedule.status,
      meetingUrl: schedule.meetingUrl ?? '',
      location: schedule.location ?? 'Online Class',
    };
  }

  private buildWeeklySchedule(enrollments: Enrollment[]) {
    const week = this.emptyWeeklySchedule();
    for (const enrollment of enrollments) {
      if (!enrollment.batch) continue;
      for (const day of enrollment.batch.classDays) {
        const dayItem = week.find((item) => item.day === day);
        if (!dayItem) continue;
        dayItem.classes.push({
          courseTitle: enrollment.course.title,
          startTime: enrollment.batch.startTime ?? '',
          endTime: enrollment.batch.endTime ?? '',
          mode: this.formatMode(enrollment.batch.mode),
        });
      }
    }
    return week;
  }

  private emptyWeeklySchedule() {
    return [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ].map((day) => ({ day, classes: [] as Array<Record<string, string>> }));
  }

  private mapAssignmentListItem(
    assignment: Assignment,
    submission?: AssignmentSubmission,
  ) {
    const status = this.assignmentStatus(assignment, submission);
    return {
      id: assignment.id,
      title: assignment.title,
      courseTitle: assignment.course.title,
      moduleTitle: assignment.module?.title ?? 'Course module',
      dueDate: assignment.dueDate?.toISOString() ?? null,
      totalMarks: assignment.totalMarks,
      status,
      submittedAt: submission?.submittedAt?.toISOString() ?? null,
      marksObtained: submission?.marksObtained ?? null,
      feedback: submission?.feedback ?? null,
    };
  }

  private assignmentStatus(
    assignment: Assignment,
    submission?: AssignmentSubmission,
  ) {
    if (submission?.status) return submission.status;
    return this.isAssignmentLate(assignment) ? 'late' : 'pending';
  }

  private isAssignmentLate(assignment: Assignment) {
    return assignment.dueDate ? assignment.dueDate.getTime() < Date.now() : false;
  }

  private mapCertificateListItem(certificate: Certificate) {
    return {
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      courseTitle: certificate.course.title,
      studentName: certificate.student.user.name,
      issueDate: certificate.issueDate,
      status: certificate.status,
      verificationCode: certificate.verificationCode,
      pdfUrl: certificate.pdfUrl ?? '',
    };
  }

  private async buildCertificateEligibility(student: StudentProfile) {
    const enrollments = await this.getStudentEnrollments(student.id);
    const issuedCertificates = await this.certificatesRepository.find({
      where: { student: { id: student.id } },
      relations: { course: true, student: true },
    });
    const issuedCourseIds = new Set(
      issuedCertificates
        .filter((certificate) => certificate.status === 'issued')
        .map((certificate) => certificate.course.id),
    );

    return Promise.all(
      enrollments
        .filter((enrollment) => !issuedCourseIds.has(enrollment.course.id))
        .map(async (enrollment) => {
          const attendanceRecords = await this.attendanceRepository.find({
            where: {
              student: { id: student.id },
              course: { id: enrollment.course.id },
            },
          });
          const attendanceSummary = this.buildAttendanceSummary(attendanceRecords);

          const assignments = await this.assignmentsRepository.find({
            where: { course: { id: enrollment.course.id }, isPublished: true },
            relations: { course: true },
          });
          const assignmentIds = assignments.map((assignment) => assignment.id);
          const checkedSubmissions = assignmentIds.length
            ? await this.submissionsRepository
                .createQueryBuilder('submission')
                .leftJoinAndSelect('submission.assignment', 'assignment')
                .leftJoinAndSelect('submission.student', 'student')
                .where('student.id = :studentId', { studentId: student.id })
                .andWhere('assignment.id IN (:...assignmentIds)', { assignmentIds })
                .andWhere('submission.status = :status', { status: 'checked' })
                .getCount()
            : 0;

          const progressPercentage = Number(enrollment.progressPercentage);
          const attendancePercentage = attendanceSummary.percentage;
          const totalAssignments = assignments.length;
          const assignmentsCompleted = checkedSubmissions;
          const assignmentReady = totalAssignments
            ? assignmentsCompleted >= totalAssignments
            : progressPercentage >= 100;
          const eligible =
            progressPercentage >= 100 &&
            attendancePercentage >= 80 &&
            assignmentReady;

          return {
            courseId: enrollment.course.id,
            courseTitle: enrollment.course.title,
            status: eligible ? 'eligible' : 'in_progress',
            progressPercentage,
            attendancePercentage,
            assignmentsCompleted,
            totalAssignments,
            eligible,
          };
        }),
    );
  }

  private getPublishedLessons(courseId: string) {
    return this.lessonsRepository.find({
      where: { course: { id: courseId }, isPublished: true },
      relations: { module: true },
      order: { sortOrder: 'ASC' },
    });
  }

  private async buildCurrentCourse(enrollment: Enrollment) {
    return {
      id: enrollment.course.id,
      title: enrollment.course.title,
      slug: enrollment.course.slug,
      progressPercentage: Number(enrollment.progressPercentage),
      batchTitle: enrollment.batch?.title ?? 'Self-paced',
      batchCode: enrollment.batch?.code ?? 'SG-SELF',
    };
  }

  private async buildUpcomingClass(enrollment: Enrollment) {
    const lessons = await this.getPublishedLessons(enrollment.course.id);
    const completedLessons = this.completedLessonCount(
      lessons.length,
      Number(enrollment.progressPercentage),
    );
    const lesson = lessons[completedLessons] ?? lessons.at(-1);

    return {
      courseTitle: enrollment.course.title,
      moduleTitle: lesson?.module?.title ?? 'Course module',
      lessonTitle: lesson?.title ?? 'Next lesson',
      date: this.nextClassDate(enrollment.batch?.classDays ?? []),
      startTime: enrollment.batch?.startTime ?? '',
      endTime: enrollment.batch?.endTime ?? '',
      mode: this.formatMode(enrollment.batch?.mode ?? enrollment.course.mode),
    };
  }

  private async buildRecentLessons(enrollment: Enrollment) {
    const lessons = await this.getPublishedLessons(enrollment.course.id);
    const completedLessons = this.completedLessonCount(
      lessons.length,
      Number(enrollment.progressPercentage),
    );

    return lessons.slice(0, Math.max(completedLessons, 4)).slice(-4).map((lesson, index, sliced) => ({
      id: lesson.id,
      title: lesson.title,
      courseTitle: enrollment.course.title,
      durationMinutes: lesson.durationMinutes ?? 0,
      completed: index < sliced.length - 1 || completedLessons >= lessons.length,
    }));
  }

  private async buildFeeStatus(enrollments: Enrollment[]) {
    if (!enrollments.length) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        status: 'paid',
      };
    }

    const enrollmentIds = enrollments.map((item) => item.id);
    const feePlans = await this.feePlansRepository
      .createQueryBuilder('feePlan')
      .leftJoinAndSelect('feePlan.enrollment', 'enrollment')
      .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
      .getMany();
    const payments = await this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.enrollment', 'enrollment')
      .where('enrollment.id IN (:...enrollmentIds)', { enrollmentIds })
      .andWhere('payment.status = :status', { status: 'verified' })
      .getMany();

    const totalAmount = feePlans.reduce(
      (sum, item) => sum + Number(item.payableAmount ?? item.totalAmount),
      0,
    );
    const paidAmountFromPlan = feePlans.reduce(
      (sum, item) => sum + Number(item.paidAmount ?? 0),
      0,
    );
    const paidAmountFromPayments = payments.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const paidAmount = Math.max(paidAmountFromPlan, paidAmountFromPayments);
    const pendingAmount = Math.max(totalAmount - paidAmount, 0);

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      status: pendingAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
    };
  }

  private buildAttendanceSummary(records: Attendance[]) {
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      percentage: 0,
    };

    for (const record of records) {
      summary[record.status] += 1;
    }

    const total = records.length;
    const countedAsAttended = summary.present + summary.late;
    summary.percentage = total ? Math.round((countedAsAttended / total) * 100) : 0;

    return summary;
  }

  private averageProgress(enrollments: Enrollment[]) {
    if (!enrollments.length) return 0;
    const total = enrollments.reduce(
      (sum, item) => sum + Number(item.progressPercentage),
      0,
    );
    return Math.round(total / enrollments.length);
  }

  private completedLessonCount(totalLessons: number, progress: number) {
    return Math.min(Math.round((totalLessons * progress) / 100), totalLessons);
  }

  private nextClassDate(classDays: string[]) {
    const now = new Date();
    if (!classDays.length) {
      return now.toISOString().slice(0, 10);
    }

    const targets = classDays
      .map((day) => dayIndexes[day.toLowerCase()])
      .filter((day): day is number => typeof day === 'number');
    if (!targets.length) {
      return now.toISOString().slice(0, 10);
    }

    let selectedOffset = 7;
    for (const target of targets) {
      const offset = (target - now.getDay() + 7) % 7;
      selectedOffset = Math.min(selectedOffset, offset || 7);
    }

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + selectedOffset);
    return nextDate.toISOString().slice(0, 10);
  }

  private formatDuration(duration: number, unit: string) {
    return `${duration} ${unit}`;
  }

  private formatLevel(level: string) {
    const labels: Record<string, string> = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return labels[level] ?? level;
  }

  private resolveInvoiceCourseTitle(invoice: Invoice) {
    return (
      invoice.payment?.enrollment?.course?.title
      ?? invoice.enrollment?.course?.title
      ?? invoice.admissionApplication?.course?.title
      ?? 'Course Fee'
    );
  }

  async getFeePaymentPreview(userId: string, feePlanId: string) {
    const student = await this.getStudentProfile(userId);
    const plan = await this.feePlansRepository.findOne({
      where: { id: feePlanId, enrollment: { student: { id: student.id } } },
      relations: { enrollment: { course: true, batch: true } },
    });
    if (!plan) throw new NotFoundException('Fee plan not found');

    const wallet = await this.walletsRepository.findOne({ where: { student: { id: student.id } } });
    const walletBalance = Number(wallet?.balance ?? 0);
    const monthlyFee = Number(plan.baseMonthlyFee ?? plan.enrollment.course.monthlyFee ?? 5000);
    const installmentAmount = plan.installmentType === 'monthly'
      ? monthlyFee
      : Number(plan.pendingAmount);
    const walletCreditUsed = Math.min(walletBalance, installmentAmount);
    const cashPayable = Math.max(0, installmentAmount - walletCreditUsed);

    return {
      feePlanId: plan.id,
      courseTitle: plan.enrollment.course.title,
      batchTitle: plan.enrollment.batch?.title ?? 'Self-paced',
      installmentType: plan.installmentType,
      monthlyFee: installmentAmount,
      walletBalance,
      walletCreditUsed,
      cashPayable,
      pendingCourseBalance: Number(plan.pendingAmount),
      dueDate: plan.dueDate ?? plan.nextDueDate ?? null,
      canPay: Number(plan.pendingAmount) > 0 && installmentAmount > 0,
    };
  }

  async submitFeePayment(userId: string, dto: SubmitStudentFeePaymentDto, file?: UploadedFileData) {
    const student = await this.getStudentProfile(userId);
    const preview = await this.getFeePaymentPreview(userId, dto.feePlanId);
    if (!preview.canPay) throw new BadRequestException('This fee plan has no pending installment to pay');

    const existingPending = await this.paymentsRepository.findOne({
      where: {
        student: { id: student.id },
        feePlan: { id: dto.feePlanId },
        status: 'pending',
      },
    });
    if (existingPending) throw new ConflictException('You already have a pending payment awaiting verification');

    if (dto.method === 'bank_transfer' && !file && preview.cashPayable > 0) {
      throw new BadRequestException('Upload payment proof screenshot for bank transfer');
    }

    const useWallet = dto.useWalletCredit !== false;
    const walletCreditUsed = useWallet ? preview.walletCreditUsed : 0;
    const cashPayable = useWallet ? preview.cashPayable : preview.monthlyFee;

    let proofUrl = '';
    if (file) {
      const saved = await this.uploadsService.saveImage(file, 'payment-proofs');
      proofUrl = saved.url;
    }

    const plan = await this.feePlansRepository.findOne({
      where: { id: dto.feePlanId },
      relations: { enrollment: { course: true } },
    });
    if (!plan) throw new NotFoundException('Fee plan not found');

    let paymentId = '';
    await this.dataSource.transaction(async (manager) => {
      const payment = await manager.save(Payment, manager.create(Payment, {
        student,
        enrollment: plan.enrollment,
        feePlan: plan,
        amount: cashPayable,
        method: dto.method,
        transactionId: dto.transactionId?.trim() || undefined,
        paymentDate: new Date().toISOString().slice(0, 10),
        status: 'pending',
        notes: [
          dto.senderNumber ? `Sender: ${dto.senderNumber}` : '',
          walletCreditUsed > 0 ? `Wallet credit to apply: PKR ${walletCreditUsed}` : '',
          proofUrl ? `Proof: ${proofUrl}` : '',
        ].filter(Boolean).join(' | '),
      }));
      paymentId = payment.id;

      const invoiceNumber = `SGA-INV-${String(Date.now()).slice(-8)}`;
      await manager.save(Invoice, manager.create(Invoice, {
        payment,
        student,
        enrollment: plan.enrollment,
        feePlan: plan,
        invoiceNumber,
        grossAmount: preview.monthlyFee,
        walletCreditUsed,
        payableAmount: preview.monthlyFee,
        paidAmount: 0,
        pendingAmount: cashPayable,
        amount: preview.monthlyFee,
        status: 'unpaid',
        dueDate: preview.dueDate ?? undefined,
      }));
    });

    await this.adminAlertsService.notifyAdmins({
      title: 'New fee payment submitted',
      message: `${student.user.name} submitted a fee payment of PKR ${cashPayable.toLocaleString('en-PK')} for ${preview.courseTitle}. Verify in payments.`,
      type: 'fee',
      actionUrl: '/admin/payments',
    });

    return {
      message: 'Payment submitted successfully. Admin will verify your payment shortly.',
      paymentId,
      cashPayable,
      walletCreditUsed,
    };
  }

  private formatMode(mode: string) {
    const labels: Record<string, string> = {
      online: 'Online',
      physical: 'Physical',
      hybrid: 'Online + Office Support',
    };
    return labels[mode] ?? mode;
  }

}
