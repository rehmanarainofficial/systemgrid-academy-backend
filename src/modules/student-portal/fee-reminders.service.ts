import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildFeeSchedule,
  getInstallmentAmount,
  resolveBillingCycle,
} from '../../common/fees/fee-schedule.util';
import { FeePlan, Notification, Payment, StudentProfile } from '../../database/entities';
import { AdmissionEmailService } from '../admissions/email.service';

@Injectable()
export class FeeRemindersService {
  private readonly logger = new Logger(FeeRemindersService.name);

  constructor(
    @InjectRepository(FeePlan)
    private readonly feePlansRepository: Repository<FeePlan>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(StudentProfile)
    private readonly studentsRepository: Repository<StudentProfile>,
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly emailService: AdmissionEmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async processDailyFeeWindows() {
    const plans = await this.feePlansRepository.find({
      where: {},
      relations: {
        enrollment: { student: { user: true }, course: true },
        student: { user: true },
      },
    });

    const today = new Date().toISOString().slice(0, 10);

    for (const plan of plans) {
      if (Number(plan.pendingAmount) <= 0) continue;

      const student = plan.student ?? plan.enrollment.student;
      const user = student?.user ?? plan.enrollment.student?.user;
      if (!user?.email) continue;

      const billingCycle = resolveBillingCycle(plan);
      if (billingCycle === 'full_course') continue;

      const hasPendingPayment = await this.paymentsRepository.exist({
        where: {
          student: { id: student.id },
          feePlan: { id: plan.id },
          status: 'pending',
        },
      });

      const installmentAmount = getInstallmentAmount(plan);
      const schedule = buildFeeSchedule({
        anchorDate: plan.enrollment.enrolledAt,
        billingCycle,
        courseDurationMonths: plan.courseDurationMonths,
        installmentsPaid: plan.installmentsPaid,
        pendingAmount: Number(plan.pendingAmount),
        installmentAmount,
        hasPendingPayment,
        portalAccessSuspended: student.portalAccessSuspended,
      });

      if (schedule.isReminderDay && plan.lastFeeReminderSentAt !== today) {
        await this.emailService.sendFeeDueReminderEmail({
          email: user.email,
          studentName: user.name,
          courseTitle: plan.enrollment.course.title,
          installmentLabel: schedule.installmentLabel,
          amount: installmentAmount,
          windowOpensAt: schedule.windowOpensAt,
          windowClosesAt: schedule.windowClosesAt,
        });

        await this.notificationsRepository.save(
          this.notificationsRepository.create({
            user,
            title: `${schedule.installmentLabel} fee payment opens today`,
            message: `Your ${schedule.installmentLabel.toLowerCase()} fee of PKR ${installmentAmount.toLocaleString('en-PK')} for ${plan.enrollment.course.title} is now payable until ${schedule.windowClosesAt}.`,
            type: 'fee',
            actionUrl: '/student/payments',
          }),
        );

        plan.lastFeeReminderSentAt = today;
        await this.feePlansRepository.save(plan);
      }

      if (schedule.isOverdue && !student.portalAccessSuspended && !hasPendingPayment) {
        student.portalAccessSuspended = true;
        student.portalSuspendedReason = `Fee payment overdue for ${plan.enrollment.course.title}. Pay or contact admin to restore access.`;
        student.portalSuspendedAt = new Date();
        await this.studentsRepository.save(student);
        this.logger.warn(`Suspended portal access for student ${student.id} due to overdue fee`);
      }
    }
  }
}
