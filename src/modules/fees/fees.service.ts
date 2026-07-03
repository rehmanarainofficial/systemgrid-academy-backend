import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource } from 'typeorm';
import { AuditLog, Course, Enrollment, FeePlan, Payment, StudentProfile, User } from '../../database/entities';
import { AdminFeesQueryDto } from './dto/admin-fees-query.dto';
import { CreateFeePlanDto } from './dto/create-fee-plan.dto';
import { UpdateFeePlanDto } from './dto/update-fee-plan.dto';

@Injectable()
export class FeesService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(query: AdminFeesQueryDto) {
    const repository = this.dataSource.getRepository(FeePlan);
    const builder = repository.createQueryBuilder('plan')
      .leftJoinAndSelect('plan.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('enrollment.batch', 'batch')
      .orderBy('plan.createdAt', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => {
        where.where('user.name ILIKE :search', { search }).orWhere('user.email ILIKE :search', { search }).orWhere('course.title ILIKE :search', { search }).orWhere('batch.title ILIKE :search', { search });
      }));
    }
    if (query.studentId) builder.andWhere('student.id = :studentId', { studentId: query.studentId });
    if (query.courseId) builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    if (query.batchId) builder.andWhere('batch.id = :batchId', { batchId: query.batchId });
    if (query.status !== 'all') builder.andWhere('plan.status = :status', { status: query.status });
    const [plans, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const allPlans = await repository.find();
    return {
      summary: {
        totalPayable: allPlans.reduce((sum, item) => sum + Number(item.payableAmount), 0),
        paidAmount: allPlans.reduce((sum, item) => sum + Number(item.paidAmount), 0),
        pendingAmount: allPlans.reduce((sum, item) => sum + Number(item.pendingAmount), 0),
        paidPlans: allPlans.filter((item) => item.status === 'paid').length,
        partialPlans: allPlans.filter((item) => item.status === 'partial').length,
        unpaidPlans: allPlans.filter((item) => item.status === 'unpaid').length,
      },
      feePlans: plans.map((item) => this.mapPlan(item)),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) },
    };
  }

  async options() {
    const [students, enrollments, courses] = await Promise.all([
      this.dataSource.getRepository(StudentProfile).find({ relations: { user: true }, order: { createdAt: 'DESC' }, take: 100 }),
      this.dataSource.getRepository(Enrollment).find({ relations: { student: true, course: true, batch: true }, order: { enrolledAt: 'DESC' } }),
      this.dataSource.getRepository(Course).find({ order: { title: 'ASC' } }),
    ]);
    const existingPlans = await this.dataSource.getRepository(FeePlan).find({ relations: { enrollment: true } });
    const feeEnrollmentIds = new Set(existingPlans.map((item) => item.enrollment.id));
    return {
      students: students.map((student) => ({ id: student.id, name: student.user.name, email: student.user.email })),
      enrollments: enrollments.map((enrollment) => ({ id: enrollment.id, studentId: enrollment.student.id, courseId: enrollment.course.id, courseTitle: enrollment.course.title, batchId: enrollment.batch?.id ?? '', batchTitle: enrollment.batch?.title ?? '', status: enrollment.status, hasFeePlan: feeEnrollmentIds.has(enrollment.id) })),
      courses: courses.map((course) => ({ id: course.id, title: course.title })),
      batches: enrollments.filter((item) => item.batch).map((item) => ({ id: item.batch!.id, title: item.batch!.title, courseId: item.course.id })),
    };
  }

  async findOne(id: string) {
    const plan = await this.dataSource.getRepository(FeePlan).findOne({ where: { id }, relations: { enrollment: { student: { user: true }, course: true, batch: true } } });
    if (!plan) throw new NotFoundException('Fee plan not found');
    return this.mapPlan(plan);
  }

  async create(dto: CreateFeePlanDto, actorId: string) {
    const enrollment = await this.enrollment(dto.studentId, dto.enrollmentId);
    const existing = await this.dataSource.getRepository(FeePlan).findOne({ where: { enrollment: { id: dto.enrollmentId } } });
    if (existing) throw new ConflictException('This enrollment already has a fee plan');
    const values = this.calculate(dto.totalAmount, dto.discountAmount ?? 0, dto.paidAmount ?? 0);
    const plan = await this.dataSource.getRepository(FeePlan).save({ enrollment, ...values, installmentType: dto.installmentType, dueDate: dto.dueDate });
    await this.log(actorId, 'create', plan.id, { enrollmentId: enrollment.id });
    return this.findOne(plan.id);
  }

  async update(id: string, dto: UpdateFeePlanDto, actorId: string) {
    const repository = this.dataSource.getRepository(FeePlan);
    const plan = await repository.findOne({ where: { id }, relations: { enrollment: { student: true } } });
    if (!plan) throw new NotFoundException('Fee plan not found');
    if (dto.studentId || dto.enrollmentId) {
      plan.enrollment = await this.enrollment(dto.studentId ?? plan.enrollment.student.id, dto.enrollmentId ?? plan.enrollment.id);
    }
    const totalAmount = dto.totalAmount ?? Number(plan.totalAmount);
    const discountAmount = dto.discountAmount ?? Number(plan.discountAmount);
    const paidAmount = dto.paidAmount ?? Number(plan.paidAmount);
    Object.assign(plan, this.calculate(totalAmount, discountAmount, paidAmount));
    if (dto.installmentType) plan.installmentType = dto.installmentType;
    if (dto.dueDate !== undefined) plan.dueDate = dto.dueDate;
    await repository.save(plan);
    await this.log(actorId, 'update', id, { fields: Object.keys(dto) });
    return this.findOne(id);
  }

  async remove(id: string, actorId: string) {
    const repository = this.dataSource.getRepository(FeePlan);
    const plan = await repository.findOne({ where: { id }, relations: { enrollment: true } });
    if (!plan) throw new NotFoundException('Fee plan not found');
    const payments = await this.dataSource.getRepository(Payment).count({ where: { feePlan: { id: plan.id } } });
    if (payments) throw new ConflictException('This fee plan has payment records and cannot be deleted');
    await repository.remove(plan);
    await this.log(actorId, 'delete', id);
    return { message: 'Fee plan deleted successfully' };
  }

  private async enrollment(studentId: string, enrollmentId: string) {
    const enrollment = await this.dataSource.getRepository(Enrollment).findOne({ where: { id: enrollmentId, student: { id: studentId } }, relations: { student: { user: true }, course: true, batch: true } });
    if (!enrollment) throw new BadRequestException('Enrollment does not belong to selected student');
    return enrollment;
  }

  private calculate(totalAmount: number, discountAmount: number, paidAmount: number) {
    if (discountAmount > totalAmount) throw new BadRequestException('Discount cannot exceed total amount');
    const payableAmount = totalAmount - discountAmount;
    if (paidAmount > payableAmount) throw new BadRequestException('Paid amount cannot exceed payable amount');
    const pendingAmount = payableAmount - paidAmount;
    return { totalAmount, discountAmount, payableAmount, paidAmount, pendingAmount, status: pendingAmount <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid' as 'paid' | 'partial' | 'unpaid' };
  }

  private mapPlan(plan: FeePlan) {
    return {
      id: plan.id,
      enrollmentId: plan.enrollment.id,
      studentId: plan.enrollment.student.id,
      studentName: plan.enrollment.student.user.name,
      studentEmail: plan.enrollment.student.user.email,
      courseTitle: plan.enrollment.course.title,
      batchTitle: plan.enrollment.batch?.title ?? '',
      totalAmount: Number(plan.totalAmount),
      discountAmount: Number(plan.discountAmount),
      payableAmount: Number(plan.payableAmount),
      paidAmount: Number(plan.paidAmount),
      pendingAmount: Number(plan.pendingAmount),
      installmentType: plan.installmentType,
      dueDate: plan.dueDate ?? null,
      status: plan.status,
    };
  }

  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) {
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'fees', recordId, metadata });
  }
}
