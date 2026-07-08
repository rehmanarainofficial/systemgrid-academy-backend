import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLog, Invoice, Payment, User } from '../../database/entities';
import { AdminInvoicesQueryDto } from './dto/admin-invoices-query.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(query: AdminInvoicesQueryDto) {
    const repository = this.dataSource.getRepository(Invoice);
    // Invoices can originate from a recorded Payment (post-enrollment) OR from an
    // admission (created at submit time, before any Payment exists). Join both
    // paths + the admission application so neither one crashes the mapper.
    const builder = repository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.payment', 'payment')
      .leftJoinAndSelect('payment.student', 'pstudent')
      .leftJoinAndSelect('pstudent.user', 'puser')
      .leftJoinAndSelect('payment.enrollment', 'penrollment')
      .leftJoinAndSelect('penrollment.course', 'pcourse')
      .leftJoinAndSelect('penrollment.batch', 'pbatch')
      .leftJoinAndSelect('invoice.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('invoice.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('enrollment.batch', 'batch')
      .leftJoinAndSelect('invoice.admissionApplication', 'application')
      .leftJoinAndSelect('application.course', 'appcourse')
      .orderBy('invoice.issuedAt', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere('(invoice.invoiceNumber ILIKE :search OR puser.name ILIKE :search OR puser.email ILIKE :search OR user.name ILIKE :search OR user.email ILIKE :search OR application.name ILIKE :search OR application.email ILIKE :search OR pcourse.title ILIKE :search OR course.title ILIKE :search OR appcourse.title ILIKE :search)', { search });
    }
    if (query.studentId) builder.andWhere('(pstudent.id = :studentId OR student.id = :studentId)', { studentId: query.studentId });
    if (query.status !== 'all') builder.andWhere('invoice.status = :status', { status: query.status });
    if (query.dateFrom) builder.andWhere('invoice.issuedAt >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo) builder.andWhere('invoice.issuedAt <= :dateTo', { dateTo: query.dateTo });
    const [invoices, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const all = await repository.find();
    const month = new Date().toISOString().slice(0, 7);
    return {
      summary: {
        totalInvoices: all.length,
        paidInvoices: all.filter((item) => item.status === 'paid').length,
        unpaidInvoices: all.filter((item) => item.status === 'unpaid').length,
        cancelledInvoices: all.filter((item) => item.status === 'cancelled').length,
        totalAmount: all.filter((item) => item.status !== 'cancelled').reduce((sum, item) => sum + Number(item.amount), 0),
        thisMonthAmount: all.filter((item) => item.status !== 'cancelled' && item.issuedAt.toISOString().startsWith(month)).reduce((sum, item) => sum + Number(item.amount), 0),
      },
      invoices: invoices.map((invoice) => this.mapList(invoice)),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) },
    };
  }

  async findOne(id: string) {
    const invoice = await this.dataSource.getRepository(Invoice).findOne({
      where: { id },
      relations: {
        payment: { student: { user: true }, enrollment: { course: true, batch: true } },
        student: { user: true },
        enrollment: { course: true, batch: true },
        admissionApplication: { course: true },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    const resolved = this.resolve(invoice);
    return {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: Number(invoice.amount),
        issuedAt: invoice.issuedAt,
        status: invoice.status,
        pdfUrl: invoice.pdfUrl ?? '',
        studentName: resolved.studentName,
        studentEmail: resolved.studentEmail,
        courseTitle: resolved.courseTitle,
        batchTitle: resolved.batchTitle,
        paymentDate: resolved.paymentDate,
        paymentMethod: resolved.paymentMethod,
        notes: '',
        academy: { name: 'SystemGrid Academy', website: 'academy.thesystemgrid.com', email: 'academy@thesystemgrid.com', city: 'Karachi, Pakistan' },
      },
    };
  }

  // Pull display fields from whichever source the invoice actually has: a
  // recorded payment, a direct student/enrollment link, or the admission form.
  private resolve(invoice: Invoice) {
    const student = invoice.payment?.student ?? invoice.student ?? undefined;
    const enrollment = invoice.payment?.enrollment ?? invoice.enrollment ?? undefined;
    const application = invoice.admissionApplication ?? undefined;
    return {
      studentId: student?.id ?? '',
      studentName: student?.user?.name ?? application?.name ?? 'Admission applicant',
      studentEmail: student?.user?.email ?? application?.email ?? '',
      courseTitle: enrollment?.course?.title ?? application?.course?.title ?? '',
      batchTitle: enrollment?.batch?.title ?? '',
      paymentId: invoice.payment?.id ?? '',
      paymentDate: invoice.payment?.paymentDate ?? null,
      paymentMethod: invoice.payment?.method ?? null,
    };
  }

  async create(dto: CreateInvoiceDto, actorId: string) {
    const payment = await this.dataSource.getRepository(Payment).findOne({ where: { id: dto.paymentId }, relations: { student: { user: true }, enrollment: { course: true, batch: true } } });
    if (!payment) throw new BadRequestException('Payment not found');
    const existing = await this.dataSource.getRepository(Invoice).findOne({ where: { payment: { id: payment.id } } });
    if (existing) throw new ConflictException('This payment already has an invoice');
    const invoice = await this.dataSource.getRepository(Invoice).save({ payment, invoiceNumber: await this.nextNumber(), amount: dto.amount ?? payment.amount, status: dto.status ?? (payment.status === 'verified' ? 'paid' : 'unpaid') });
    await this.log(actorId, 'create', invoice.id, { paymentId: payment.id });
    return this.findOne(invoice.id);
  }

  async update(id: string, dto: UpdateInvoiceDto, actorId: string) {
    const invoice = await this.entity(id);
    if (invoice.status === 'cancelled') throw new ConflictException('Cancelled invoices cannot be edited');
    if (dto.amount !== undefined) invoice.amount = dto.amount;
    if (dto.status) invoice.status = dto.status;
    await this.dataSource.getRepository(Invoice).save(invoice);
    await this.log(actorId, 'update', id, { fields: Object.keys(dto) });
    return this.findOne(id);
  }

  async cancel(id: string, actorId: string) {
    const invoice = await this.entity(id);
    invoice.status = 'cancelled';
    await this.dataSource.getRepository(Invoice).save(invoice);
    await this.log(actorId, 'cancel', id);
    return { message: 'Invoice cancelled successfully', status: invoice.status };
  }

  async remove(id: string, actorId: string) {
    const invoice = await this.entity(id);
    if (invoice.status === 'paid') throw new ConflictException('Paid invoices should be cancelled instead of deleted');
    await this.dataSource.getRepository(Invoice).remove(invoice);
    await this.log(actorId, 'delete', id);
    return { message: 'Invoice deleted successfully' };
  }

  private async entity(id: string) {
    const invoice = await this.dataSource.getRepository(Invoice).findOne({ where: { id }, relations: { payment: true } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private mapList(invoice: Invoice) {
    const resolved = this.resolve(invoice);
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentId: resolved.studentId,
      studentName: resolved.studentName,
      studentEmail: resolved.studentEmail,
      courseTitle: resolved.courseTitle,
      batchTitle: resolved.batchTitle,
      paymentId: resolved.paymentId,
      amount: Number(invoice.amount),
      issuedAt: invoice.issuedAt,
      status: invoice.status,
      pdfUrl: invoice.pdfUrl ?? '',
      notes: '',
    };
  }

  private async nextNumber() {
    const count = await this.dataSource.getRepository(Invoice).count();
    return `SGA-INV-${String(count + 1).padStart(4, '0')}`;
  }

  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) {
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'invoices', recordId, metadata });
  }
}
