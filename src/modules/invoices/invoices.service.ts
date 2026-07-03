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
    const builder = repository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.payment', 'payment')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('payment.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('enrollment.batch', 'batch')
      .orderBy('invoice.issuedAt', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere('(invoice.invoiceNumber ILIKE :search OR user.name ILIKE :search OR user.email ILIKE :search OR course.title ILIKE :search)', { search });
    }
    if (query.studentId) builder.andWhere('student.id = :studentId', { studentId: query.studentId });
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
      relations: { payment: { student: { user: true }, enrollment: { course: true, batch: true } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return {
      invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      issuedAt: invoice.issuedAt,
      status: invoice.status,
      pdfUrl: invoice.pdfUrl ?? '',
      studentName: invoice.payment.student.user.name,
      studentEmail: invoice.payment.student.user.email,
      courseTitle: invoice.payment.enrollment.course.title,
      batchTitle: invoice.payment.enrollment.batch?.title ?? '',
      paymentDate: invoice.payment.paymentDate,
      paymentMethod: invoice.payment.method,
      notes: '',
      academy: { name: 'SystemGrid Academy', website: 'academy.thesystemgrid.com', email: 'academy@thesystemgrid.com', city: 'Karachi, Pakistan' },
      },
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
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentId: invoice.payment.student.id,
      studentName: invoice.payment.student.user.name,
      studentEmail: invoice.payment.student.user.email,
      courseTitle: invoice.payment.enrollment.course.title,
      batchTitle: invoice.payment.enrollment.batch?.title ?? '',
      paymentId: invoice.payment.id,
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
