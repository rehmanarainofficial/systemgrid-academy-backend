import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  Attendance,
  Assignment,
  AuditLog,
  Batch,
  Certificate,
  Course,
  Enrollment,
  FeePlan,
  Gender,
  StudentSource,
  StudentProfile,
  User,
} from '../../database/entities';
import { AdminStudentsQueryDto } from './dto/admin-students-query.dto';
import { CreateAdminStudentDto } from './dto/create-admin-student.dto';
import { EnrollAdminStudentDto } from './dto/enroll-admin-student.dto';
import { ResetStudentPasswordDto } from './dto/reset-student-password.dto';
import { UpdateAdminStudentDto } from './dto/update-admin-student.dto';
import { UpdateStudentStatusDto } from './dto/update-student-status.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly studentsRepository: Repository<StudentProfile>,
    private readonly dataSource: DataSource,
  ) {}

  async findAdminList(query: AdminStudentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const builder = this.studentsRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.course', 'course')
      .leftJoinAndSelect('enrollment.batch', 'batch')
      .orderBy('student.createdAt', 'DESC');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(
        new Brackets((where) => {
          where
            .where('user.name ILIKE :search', { search })
            .orWhere('user.email ILIKE :search', { search })
            .orWhere('user.phone ILIKE :search', { search });
        }),
      );
    }
    if (query.status && query.status !== 'all') {
      builder.andWhere('student.status = :status', { status: query.status });
    }
    if (query.courseId) {
      builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    }
    if (query.batchId) {
      builder.andWhere('batch.id = :batchId', { batchId: query.batchId });
    }
    if (query.city?.trim()) {
      builder.andWhere('student.city ILIKE :city', {
        city: `%${query.city.trim()}%`,
      });
    }

    const [students, totalItems] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const profiles = await this.attachFinancialAndAttendance(students);

    const grouped = await this.studentsRepository
      .createQueryBuilder('student')
      .select('student.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('student.status')
      .getRawMany<{ status: string; count: string }>();
    const counts = Object.fromEntries(
      grouped.map((item) => [item.status, Number(item.count)]),
    );
    const total = await this.studentsRepository.count();

    return {
      summary: {
        total,
        active: counts.active ?? 0,
        inactive: counts.inactive ?? 0,
        graduated: counts.graduated ?? 0,
        dropped: counts.dropped ?? 0,
      },
      students: profiles,
      pagination: {
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
        totalItems,
      },
    };
  }

  async getFilterOptions() {
    const [courses, batches, cities] = await Promise.all([
      this.dataSource.getRepository(Course).find({
        where: { isPublished: true },
        order: { title: 'ASC' },
      }),
      this.dataSource.getRepository(Batch).find({
        relations: { course: true },
        order: { startDate: 'DESC' },
      }),
      this.studentsRepository
        .createQueryBuilder('student')
        .select('DISTINCT student.city', 'city')
        .where('student.city IS NOT NULL')
        .andWhere("student.city <> ''")
        .orderBy('student.city', 'ASC')
        .getRawMany<{ city: string }>(),
    ]);
    return {
      courses: courses.map((course) => ({ id: course.id, title: course.title })),
      batches: batches.map((batch) => ({
        id: batch.id,
        title: batch.title,
        courseId: batch.course.id,
      })),
      cities: cities.map((item) => item.city),
    };
  }

  async findAdminDetail(id: string) {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: {
        user: true,
        enrollments: { course: true, batch: true },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const [mapped] = await this.attachFinancialAndAttendance([student]);
    const [certificates, feePlans, attendance, activity] = await Promise.all([
      this.dataSource.getRepository(Certificate).find({
        where: { student: { id } },
        relations: { course: true },
        order: { issueDate: 'DESC' },
      }),
      this.dataSource.getRepository(FeePlan).find({
        where: { enrollment: { student: { id } } },
        relations: { enrollment: { student: true, course: true } },
        order: { createdAt: 'DESC' },
      }),
      this.dataSource.getRepository(Attendance).find({
        where: { student: { id } },
        relations: { batch: true, course: true },
        order: { date: 'DESC' },
        take: 50,
      }),
      this.dataSource.getRepository(AuditLog).find({
        where: { module: 'students', recordId: id },
        relations: { user: true },
        order: { createdAt: 'DESC' },
        take: 20,
      }),
    ]);
    const courseIds = (student.enrollments ?? []).map((item) => item.course.id);
    const batchIds = (student.enrollments ?? []).flatMap((item) => item.batch ? [item.batch.id] : []);
    const assignmentsCount = courseIds.length
      ? await this.dataSource.getRepository(Assignment).count({
          where: [
            { course: { id: In(courseIds) } },
            ...(batchIds.length ? [{ batch: { id: In(batchIds) } }] : []),
          ],
        })
      : 0;
    const attendanceCounts = attendance.reduce(
      (counts, item) => ({ ...counts, [item.status]: counts[item.status] + 1 }),
      { present: 0, absent: 0, late: 0, leave: 0 },
    );
    return {
      ...mapped,
      profile: {
        guardianName: student.guardianName ?? '',
        guardianPhone: student.guardianPhone ?? '',
        cnic: student.cnic ?? '',
        dateOfBirth: student.dateOfBirth ?? '',
        gender: student.gender ?? '',
        address: student.address ?? '',
        educationLevel: student.educationLevel ?? '',
        source: student.source,
      },
      summary: {
        totalEnrollments: (student.enrollments ?? []).length,
        activeEnrollments: (student.enrollments ?? []).filter((item) => item.status === 'active').length,
        assignmentsCount,
        certificatesCount: certificates.length,
        totalPayable: feePlans.reduce((sum, item) => sum + Number(item.payableAmount), 0),
        totalPaid: feePlans.reduce((sum, item) => sum + Number(item.paidAmount), 0),
        pendingFee: feePlans.reduce((sum, item) => sum + Number(item.pendingAmount), 0),
        attendance: attendanceCounts,
      },
      enrollments: (student.enrollments ?? []).map((enrollment) => ({
        id: enrollment.id,
        courseTitle: enrollment.course.title,
        batchTitle: enrollment.batch?.title ?? '',
        status: enrollment.status,
        progressPercentage: Number(enrollment.progressPercentage),
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt ?? null,
      })),
      feePlans: feePlans.map((plan) => ({
        id: plan.id,
        enrollmentId: plan.enrollment.id,
        courseTitle: plan.enrollment.course.title,
        totalAmount: Number(plan.totalAmount),
        discountAmount: Number(plan.discountAmount),
        payableAmount: Number(plan.payableAmount),
        paidAmount: Number(plan.paidAmount),
        pendingAmount: Number(plan.pendingAmount),
        installmentType: plan.installmentType,
        dueDate: plan.dueDate ?? null,
        status: plan.status,
      })),
      attendance: attendance.map((item) => ({
        id: item.id,
        date: item.date,
        status: item.status,
        remarks: item.remarks ?? '',
        courseTitle: item.course?.title ?? '',
        batchTitle: item.batch?.title ?? '',
      })),
      certificates: certificates.map((certificate) => ({
        id: certificate.id,
        courseTitle: certificate.course.title,
        certificateNumber: certificate.certificateNumber,
        issueDate: certificate.issueDate,
        status: certificate.status,
        verificationCode: certificate.verificationCode,
      })),
      activity: activity.map((item) => ({
        id: item.id,
        action: item.action,
        actorName: item.user?.name ?? 'System',
        metadata: item.metadata ?? {},
        createdAt: item.createdAt,
      })),
    };
  }

  async createAdmin(dto: CreateAdminStudentDto, actorId: string) {
    const studentId = await this.dataSource.transaction(async (manager) => {
      const email = dto.email.trim().toLowerCase();
      if (await manager.findOne(User, { where: { email } })) {
        throw new ConflictException('A user with this email already exists');
      }
      const user = await manager.save(
        manager.create(User, {
          name: dto.name.trim(),
          email,
          phone: dto.phone.trim(),
          password: await bcrypt.hash(dto.password, 12),
          role: UserRole.Student,
          isActive: dto.isActive ?? dto.status === 'active',
        }),
      );
      const student = await manager.save(
        manager.create(StudentProfile, {
          user,
          city: dto.city?.trim() || undefined,
          guardianName: dto.guardianName?.trim() || undefined,
          guardianPhone: dto.guardianPhone?.trim() || undefined,
          address: dto.address?.trim() || undefined,
          educationLevel: dto.educationLevel?.trim() || undefined,
          dateOfBirth: dto.dateOfBirth,
          gender: this.normalizeGender(dto.gender),
          source: this.normalizeSource(dto.source),
          status: dto.status,
        }),
      );
      if (dto.enrollment) {
        const course = await manager.findOne(Course, { where: { id: dto.enrollment.courseId } });
        if (!course) throw new BadRequestException('Course not found');
        let batch: Batch | undefined;
        if (dto.enrollment.batchId) {
          batch = (await manager.findOne(Batch, {
            where: { id: dto.enrollment.batchId },
            relations: { course: true },
          })) ?? undefined;
          if (!batch || batch.course.id !== course.id) {
            throw new BadRequestException('Batch does not belong to the selected course');
          }
        }
        await manager.save(manager.create(Enrollment, {
          student,
          course,
          batch,
          status: dto.enrollment.status,
          progressPercentage: 0,
        }));
      }
      await manager.save(
        manager.create(AuditLog, {
          user: { id: actorId } as User,
          action: 'create',
          module: 'students',
          recordId: student.id,
          metadata: { email: user.email, source: dto.source ?? 'admin', enrolled: Boolean(dto.enrollment) },
        }),
      );
      return student.id;
    });
    return this.findAdminDetail(studentId);
  }

  async resetPassword(id: string, dto: ResetStudentPasswordDto, actorId: string) {
    const student = await this.studentsRepository.findOne({ where: { id }, relations: { user: true } });
    if (!student) throw new NotFoundException('Student not found');
    student.user.password = await bcrypt.hash(dto.password, 12);
    await this.dataSource.getRepository(User).save(student.user);
    await this.logAction(actorId, 'reset_password', id);
    return { message: 'Student password reset successfully' };
  }

  async updateAdmin(
    id: string,
    dto: UpdateAdminStudentDto,
    actorId: string,
  ) {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    if (dto.email && dto.email.toLowerCase() !== student.user.email.toLowerCase()) {
      const existing = await this.dataSource.getRepository(User).findOne({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (existing) throw new ConflictException('A user with this email already exists');
      student.user.email = dto.email.trim().toLowerCase();
    }
    if (dto.name) student.user.name = dto.name.trim();
    if (dto.phone) student.user.phone = dto.phone.trim();
    if (dto.password) student.user.password = await bcrypt.hash(dto.password, 12);
    if (dto.city !== undefined) student.city = dto.city.trim() || undefined;
    if (dto.guardianName !== undefined) student.guardianName = dto.guardianName.trim() || undefined;
    if (dto.guardianPhone !== undefined) student.guardianPhone = dto.guardianPhone.trim() || undefined;
    if (dto.address !== undefined) student.address = dto.address.trim() || undefined;
    if (dto.educationLevel !== undefined) student.educationLevel = dto.educationLevel.trim() || undefined;
    if (dto.status) {
      student.status = dto.status;
      student.user.isActive = dto.status === 'active';
    }
    await this.dataSource.getRepository(User).save(student.user);
    await this.studentsRepository.save(student);
    await this.logAction(actorId, 'update', id, { fields: Object.keys(dto) });
    return this.safeStudent(student, student.user);
  }

  async updateStatus(
    id: string,
    dto: UpdateStudentStatusDto,
    actorId: string,
  ) {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    student.status = dto.status;
    student.user.isActive = dto.status === 'active';
    await this.dataSource.getRepository(User).save(student.user);
    await this.studentsRepository.save(student);
    await this.logAction(actorId, 'update_status', id, { status: dto.status });
    return { message: `Student status updated to ${dto.status}`, status: dto.status };
  }

  async enroll(id: string, dto: EnrollAdminStudentDto, actorId: string) {
    const student = await this.studentsRepository.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    const course = await this.dataSource.getRepository(Course).findOne({
      where: { id: dto.courseId },
    });
    if (!course) throw new BadRequestException('Course not found');
    let batch: Batch | undefined;
    if (dto.batchId) {
      batch =
        (await this.dataSource.getRepository(Batch).findOne({
          where: { id: dto.batchId },
          relations: { course: true },
        })) ?? undefined;
      if (!batch || batch.course.id !== course.id) {
        throw new BadRequestException('Batch does not belong to the selected course');
      }
    }
    const repository = this.dataSource.getRepository(Enrollment);
    const existing = await repository.findOne({
      where: { student: { id }, course: { id: course.id } },
      relations: { student: true, course: true },
    });
    if (existing) throw new ConflictException('Student is already enrolled in this course');
    const enrollment = await repository.save(
      repository.create({
        student,
        course,
        batch,
        status: dto.status,
        progressPercentage: 0,
      }),
    );
    await this.logAction(actorId, 'enroll', id, {
      enrollmentId: enrollment.id,
      courseId: course.id,
      batchId: batch?.id,
    });
    return { message: 'Student enrolled successfully', enrollmentId: enrollment.id };
  }

  async archive(id: string, actorId: string) {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    student.status = 'inactive';
    student.user.isActive = false;
    await this.dataSource.getRepository(User).save(student.user);
    await this.studentsRepository.save(student);
    await this.logAction(actorId, 'archive', id);
    return { message: 'Student account archived successfully' };
  }

  private async attachFinancialAndAttendance(students: StudentProfile[]) {
    if (!students.length) return [];
    const ids = students.map((student) => student.id);
    const [feePlans, attendance] = await Promise.all([
      this.dataSource.getRepository(FeePlan).find({
        where: { enrollment: { student: { id: In(ids) } } },
        relations: { enrollment: { student: true } },
      }),
      this.dataSource.getRepository(Attendance).find({
        where: { student: { id: In(ids) } },
        relations: { student: true },
      }),
    ]);

    return students.map((student) => {
      const studentAttendance = attendance.filter((item) => item.student.id === student.id);
      const attended = studentAttendance.filter((item) => ['present', 'late'].includes(item.status)).length;
      const activeEnrollment = (student.enrollments ?? []).find((item) => item.status === 'active');
      return {
        ...this.safeStudent(student, student.user),
        enrolledCourses: (student.enrollments ?? []).length,
        activeCourseTitle: activeEnrollment?.course?.title ?? '',
        attendancePercentage: studentAttendance.length
          ? Math.round((attended / studentAttendance.length) * 100)
          : 0,
        pendingFee: feePlans
          .filter((plan) => plan.enrollment.student.id === student.id)
          .reduce((sum, plan) => sum + Number(plan.pendingAmount), 0),
      };
    });
  }

  private safeStudent(student: StudentProfile, user: User) {
    return {
      id: student.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      city: student.city ?? '',
      status: student.status,
      isActive: user.isActive,
      createdAt: student.createdAt,
    };
  }

  private async logAction(
    actorId: string,
    action: string,
    recordId: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.dataSource.getRepository(AuditLog).save({
      user: { id: actorId } as User,
      action,
      module: 'students',
      recordId,
      metadata,
    });
  }

  private normalizeGender(value?: string): Gender | undefined {
    return value === 'male' || value === 'female' || value === 'prefer_not_to_say'
      ? value
      : undefined;
  }

  private normalizeSource(value?: string): StudentSource {
    return value === 'website' || value === 'referral' || value === 'walk_in' || value === 'social_media'
      ? value
      : 'admin';
  }
}
