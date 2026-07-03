import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource, EntityManager } from 'typeorm';
import { AuditLog, Enrollment, FeePlan, Invoice, Payment, StudentProfile, User } from '../../database/entities';
import { AdminPaymentsQueryDto } from './dto/admin-payments-query.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(query: AdminPaymentsQueryDto) {
    const repository = this.dataSource.getRepository(Payment);
    const builder = repository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('payment.enrollment', 'enrollment')
      .leftJoinAndSelect('payment.feePlan', 'feePlan')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('enrollment.batch', 'batch')
      .leftJoinAndSelect('payment.receivedBy', 'receivedBy')
      .orderBy('payment.paymentDate', 'DESC')
      .addOrderBy('payment.createdAt', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => {
        where.where('user.name ILIKE :search', { search }).orWhere('user.email ILIKE :search', { search }).orWhere('payment.transactionId ILIKE :search', { search }).orWhere('course.title ILIKE :search', { search });
      }));
    }
    if (query.studentId) builder.andWhere('student.id = :studentId', { studentId: query.studentId });
    if (query.courseId) builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    if (query.batchId) builder.andWhere('batch.id = :batchId', { batchId: query.batchId });
    if (query.method !== 'all') builder.andWhere('payment.method = :method', { method: query.method });
    if (query.status !== 'all') builder.andWhere('payment.status = :status', { status: query.status });
    if (query.dateFrom) builder.andWhere('payment.paymentDate >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo) builder.andWhere('payment.paymentDate <= :dateTo', { dateTo: query.dateTo });
    const [payments, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const [allPayments, invoices] = await Promise.all([
      repository.find(),
      this.dataSource.getRepository(Invoice).find({ relations: { payment: true } }),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);
    const verified = allPayments.filter((item) => item.status === 'verified');
    return {
      summary: {
        totalReceived: verified.reduce((sum, item) => sum + Number(item.amount), 0),
        pendingVerification: allPayments.filter((item) => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount), 0),
        verifiedPayments: verified.length,
        rejectedPayments: allPayments.filter((item) => item.status === 'rejected').length,
        todayCollection: verified.filter((item) => item.paymentDate === today).reduce((sum, item) => sum + Number(item.amount), 0),
        monthlyCollection: verified.filter((item) => item.paymentDate.startsWith(month)).reduce((sum, item) => sum + Number(item.amount), 0),
      },
      payments: payments.map((item) => this.mapPayment(item, invoices.find((invoice) => invoice.payment.id === item.id))),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) },
    };
  }

  async options() {
    const feePlans = await this.dataSource.getRepository(FeePlan).find({ relations: { enrollment: { student: { user: true }, course: true, batch: true } }, order: { createdAt: 'DESC' } });
    const students = new Map<string, { id: string; name: string; email: string }>();
    for (const plan of feePlans) students.set(plan.enrollment.student.id, { id: plan.enrollment.student.id, name: plan.enrollment.student.user.name, email: plan.enrollment.student.user.email });
    return {
      students: Array.from(students.values()),
      feePlans: feePlans.map((plan) => ({
        id: plan.id,
        studentId: plan.enrollment.student.id,
        enrollmentId: plan.enrollment.id,
        courseTitle: plan.enrollment.course.title,
        batchTitle: plan.enrollment.batch?.title ?? '',
        payableAmount: Number(plan.payableAmount),
        paidAmount: Number(plan.paidAmount),
        pendingAmount: Number(plan.pendingAmount),
        status: plan.status,
      })),
    };
  }

  async findOne(id: string) {
    const payment = await this.payment(id);
    const invoice = await this.dataSource.getRepository(Invoice).findOne({ where: { payment: { id } }, relations: { payment: true } });
    return this.mapPayment(payment, invoice ?? undefined);
  }

  async create(dto: CreatePaymentDto, actorId: string) {
    const plan = await this.feePlan(dto.feePlanId, dto.studentId);
    this.validatePaymentAmount(plan, dto.amount, dto.status === 'verified');
    if (dto.method !== 'cash' && !dto.transactionId?.trim()) throw new BadRequestException('Transaction ID is required for non-cash payments');
    let paymentId = '';
    await this.dataSource.transaction(async (manager) => {
      const payment = await manager.save(Payment, manager.create(Payment, {
        student: plan.enrollment.student,
        enrollment: plan.enrollment,
        feePlan: plan,
        amount: dto.amount,
        method: dto.method,
        transactionId: dto.transactionId?.trim() || undefined,
        paymentDate: dto.paymentDate,
        status: dto.status,
        receivedBy: { id: actorId } as User,
        notes: dto.notes?.trim() || undefined,
      }));
      paymentId = payment.id;
      if (dto.status === 'verified') await this.applyVerifiedPayment(manager, plan, payment, actorId);
      await manager.save(AuditLog, manager.create(AuditLog, { user: { id: actorId } as User, action: 'create', module: 'payments', recordId: payment.id, metadata: { status: dto.status, amount: dto.amount } }));
    });
    return this.findOne(paymentId);
  }

  async update(id: string, dto: UpdatePaymentDto, actorId: string) {
    const payment = await this.payment(id);
    if (payment.status === 'verified') throw new ConflictException('Verified payments cannot be edited. Create a reversal flow later.');
    if (dto.method && dto.method !== 'cash' && !dto.transactionId?.trim() && !payment.transactionId) throw new BadRequestException('Transaction ID is required for non-cash payments');
    if (dto.amount !== undefined) payment.amount = dto.amount;
    if (dto.method) payment.method = dto.method;
    if (dto.transactionId !== undefined) payment.transactionId = dto.transactionId.trim() || undefined;
    if (dto.paymentDate) payment.paymentDate = dto.paymentDate;
    if (dto.status) payment.status = dto.status;
    if (dto.notes !== undefined) payment.notes = dto.notes.trim() || undefined;
    await this.dataSource.transaction(async (manager) => {
      await manager.save(payment);
      if (payment.status === 'verified') {
        const plan = await manager.findOne(FeePlan, { where: { id: payment.feePlan?.id ?? '', enrollment: { id: payment.enrollment.id } }, relations: { enrollment: { student: true, course: true, batch: true } } })
          ?? await manager.findOne(FeePlan, { where: { enrollment: { id: payment.enrollment.id } }, relations: { enrollment: { student: true, course: true, batch: true } } });
        if (!plan) throw new BadRequestException('Fee plan not found for this payment');
        this.validatePaymentAmount(plan, Number(payment.amount), true);
        await this.applyVerifiedPayment(manager, plan, payment, actorId);
      }
      await manager.save(AuditLog, manager.create(AuditLog, { user: { id: actorId } as User, action: 'update', module: 'payments', recordId: id, metadata: { fields: Object.keys(dto) } }));
    });
    return this.findOne(id);
  }

  async verify(id: string, actorId: string) {
    const payment = await this.payment(id);
    if (payment.status === 'verified') throw new ConflictException('Payment is already verified');
    if (payment.status === 'rejected') throw new ConflictException('Rejected payment cannot be verified');
    const plan = await this.dataSource.getRepository(FeePlan).findOne({ where: { id: payment.feePlan?.id ?? '', enrollment: { id: payment.enrollment.id } }, relations: { enrollment: { student: true, course: true, batch: true } } })
      ?? await this.dataSource.getRepository(FeePlan).findOne({ where: { enrollment: { id: payment.enrollment.id } }, relations: { enrollment: { student: true, course: true, batch: true } } });
    if (!plan) throw new BadRequestException('Fee plan not found for this payment');
    this.validatePaymentAmount(plan, Number(payment.amount), true);
    await this.dataSource.transaction(async (manager) => {
      payment.status = 'verified';
      payment.receivedBy = { id: actorId } as User;
      await manager.save(payment);
      await this.applyVerifiedPayment(manager, plan, payment, actorId);
      await manager.save(AuditLog, manager.create(AuditLog, { user: { id: actorId } as User, action: 'verify', module: 'payments', recordId: id }));
    });
    return { message: 'Payment verified successfully', status: 'verified' };
  }

  async reject(id: string, actorId: string) {
    const payment = await this.payment(id);
    if (payment.status === 'verified') throw new ConflictException('Verified payments cannot be rejected');
    payment.status = 'rejected';
    await this.dataSource.getRepository(Payment).save(payment);
    await this.log(actorId, 'reject', id);
    return { message: 'Payment rejected successfully', status: 'rejected' };
  }

  async remove(id: string, actorId: string) {
    const payment = await this.payment(id);
    if (payment.status === 'verified') throw new ConflictException('Verified payments cannot be deleted');
    await this.dataSource.getRepository(Payment).remove(payment);
    await this.log(actorId, 'delete', id);
    return { message: 'Payment deleted successfully' };
  }

  private async payment(id: string) {
    const payment = await this.dataSource.getRepository(Payment).findOne({ where: { id }, relations: { student: { user: true }, enrollment: { course: true, batch: true }, feePlan: true, receivedBy: true } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  private async feePlan(id: string, studentId: string) {
    const plan = await this.dataSource.getRepository(FeePlan).findOne({ where: { id, enrollment: { student: { id: studentId } } }, relations: { enrollment: { student: { user: true }, course: true, batch: true } } });
    if (!plan) throw new BadRequestException('Fee plan does not belong to selected student');
    return plan;
  }

  private validatePaymentAmount(plan: FeePlan, amount: number, affectsBalance: boolean) {
    if (amount <= 0) throw new BadRequestException('Payment amount must be positive');
    if (affectsBalance && amount > Number(plan.pendingAmount)) throw new BadRequestException('Payment amount cannot exceed pending fee');
  }

  private async applyVerifiedPayment(manager: EntityManager, plan: FeePlan, payment: Payment, actorId: string) {
    plan.paidAmount = Number(plan.paidAmount) + Number(payment.amount);
    plan.pendingAmount = Math.max(0, Number(plan.payableAmount) - Number(plan.paidAmount));
    plan.status = Number(plan.pendingAmount) <= 0 ? 'paid' : 'partial';
    await manager.save(plan);
    const existing = await manager.findOne(Invoice, { where: { payment: { id: payment.id } } });
    if (!existing) {
      const invoiceNumber = `SGA-INV-${String(Date.now()).slice(-8)}`;
      await manager.save(Invoice, manager.create(Invoice, { payment, invoiceNumber, amount: payment.amount, status: 'paid' }));
    }
    await manager.save(AuditLog, manager.create(AuditLog, { user: { id: actorId } as User, action: 'sync_fee_plan', module: 'payments', recordId: payment.id, metadata: { feePlanId: plan.id } }));
  }

  private mapPayment(payment: Payment, invoice?: Invoice) {
    return {
      id: payment.id,
      studentId: payment.student.id,
      studentName: payment.student.user.name,
      studentEmail: payment.student.user.email,
      courseTitle: payment.enrollment.course.title,
      batchTitle: payment.enrollment.batch?.title ?? '',
      enrollmentId: payment.enrollment.id,
      feePlanId: payment.feePlan?.id ?? '',
      invoiceId: invoice?.id ?? '',
      invoiceNumber: invoice?.invoiceNumber ?? '',
      amount: Number(payment.amount),
      method: payment.method,
      transactionId: payment.transactionId ?? '',
      paymentDate: payment.paymentDate,
      status: payment.status,
      receivedByName: payment.receivedBy?.name ?? 'SystemGrid Academy',
      notes: payment.notes ?? '',
    };
  }

  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) {
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'payments', recordId, metadata });
  }
}
