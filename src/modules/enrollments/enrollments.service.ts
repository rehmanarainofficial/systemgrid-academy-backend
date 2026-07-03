import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AuditLog, Batch, Course, Enrollment, StudentProfile, User } from '../../database/entities';
import { AdminEnrollmentsQueryDto } from './dto/admin-enrollments-query.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    private readonly dataSource: DataSource,
  ) {}

  async findAdminList(query: AdminEnrollmentsQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const builder = this.enrollmentsRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('enrollment.batch', 'batch')
      .orderBy('enrollment.enrolledAt', 'DESC');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(
        new Brackets((where) =>
          where
            .where('user.name ILIKE :search', { search })
            .orWhere('user.email ILIKE :search', { search })
            .orWhere('course.title ILIKE :search', { search })
            .orWhere('batch.title ILIKE :search', { search }),
        ),
      );
    }
    if (query.studentId) builder.andWhere('student.id = :studentId', { studentId: query.studentId });
    if (query.courseId) builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    if (query.batchId) builder.andWhere('batch.id = :batchId', { batchId: query.batchId });
    if (query.status) builder.andWhere('enrollment.status = :status', { status: query.status });

    const [enrollments, totalItems] = await builder.skip((page - 1) * limit).take(limit).getManyAndCount();
    const grouped = await this.enrollmentsRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('enrollment.status')
      .getRawMany<{ status: string; count: string }>();
    const counts = Object.fromEntries(grouped.map((item) => [item.status, Number(item.count)]));

    return {
      summary: {
        total: await this.enrollmentsRepository.count(),
        pending: counts.pending ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        cancelled: counts.cancelled ?? 0,
        dropped: counts.dropped ?? 0,
      },
      enrollments: enrollments.map((enrollment) => this.mapEnrollment(enrollment)),
      pagination: { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) },
    };
  }

  async findAdminDetail(id: string) {
    const enrollment = await this.enrollmentsRepository.findOne({
      where: { id },
      relations: { student: { user: true }, course: true, batch: true, feePlans: true },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return this.mapEnrollment(enrollment);
  }

  async create(dto: CreateEnrollmentDto, actorId: string) {
    const enrollmentId = await this.dataSource.transaction(async (manager) => {
      const student = await manager.findOne(StudentProfile, { where: { id: dto.studentId }, relations: { user: true } });
      if (!student) throw new BadRequestException('Student not found');

      const course = await manager.findOne(Course, { where: { id: dto.courseId } });
      if (!course) throw new BadRequestException('Course not found');

      let batch: Batch | undefined;
      if (dto.batchId) {
        batch = (await manager.findOne(Batch, { where: { id: dto.batchId }, relations: { course: true } })) ?? undefined;
        if (!batch || batch.course.id !== course.id) {
          throw new BadRequestException('Batch does not belong to the selected course');
        }
      }

      const existing = await manager
        .createQueryBuilder(Enrollment, 'enrollment')
        .leftJoin('enrollment.student', 'student')
        .leftJoin('enrollment.course', 'course')
        .where('student.id = :studentId', { studentId: dto.studentId })
        .andWhere('course.id = :courseId', { courseId: dto.courseId })
        .andWhere('enrollment.status IN (:...statuses)', { statuses: ['pending', 'active'] })
        .getOne();
      if (existing) throw new ConflictException('Student already has a pending or active enrollment for this course');

      const saved = await manager.save(
        Enrollment,
        manager.create(Enrollment, {
          student,
          course,
          batch,
          status: dto.status ?? 'active',
          progressPercentage: 0,
        }),
      );
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: actorId } as User,
          action: 'create',
          module: 'enrollments',
          recordId: saved.id,
          metadata: { studentId: student.id, courseId: course.id, batchId: batch?.id, status: saved.status },
        }),
      );
      return saved.id;
    });
    return this.findAdminDetail(enrollmentId);
  }

  async updateStatus(id: string, dto: UpdateEnrollmentStatusDto, actorId: string) {
    const enrollment = await this.enrollmentsRepository.findOne({
      where: { id },
      relations: { student: { user: true }, course: true, batch: true },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    enrollment.status = dto.status;
    enrollment.completedAt = dto.status === 'completed' ? new Date() : undefined;
    const saved = await this.dataSource.transaction(async (manager) => {
      const updated = await manager.save(Enrollment, enrollment);
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: actorId } as User,
          action: 'update_status',
          module: 'enrollments',
          recordId: id,
          metadata: { status: dto.status },
        }),
      );
      return updated;
    });

    return this.mapEnrollment(saved);
  }

  private mapEnrollment(enrollment: Enrollment) {
    const feePlans = enrollment.feePlans ?? [];
    return {
      id: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt ?? null,
      progressPercentage: Number(enrollment.progressPercentage),
      student: enrollment.student
        ? {
            id: enrollment.student.id,
            name: enrollment.student.user?.name ?? '',
            email: enrollment.student.user?.email ?? '',
            phone: enrollment.student.user?.phone ?? '',
            status: enrollment.student.status,
          }
        : null,
      course: enrollment.course ? { id: enrollment.course.id, title: enrollment.course.title, slug: enrollment.course.slug } : null,
      batch: enrollment.batch ? { id: enrollment.batch.id, title: enrollment.batch.title, code: enrollment.batch.code, status: enrollment.batch.status } : null,
      fees: {
        plans: feePlans.length,
        payableAmount: feePlans.reduce((sum, plan) => sum + Number(plan.payableAmount), 0),
        paidAmount: feePlans.reduce((sum, plan) => sum + Number(plan.paidAmount), 0),
        pendingAmount: feePlans.reduce((sum, plan) => sum + Number(plan.pendingAmount), 0),
      },
    };
  }
}
