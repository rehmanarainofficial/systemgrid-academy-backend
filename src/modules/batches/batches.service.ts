import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import {
  Assignment,
  Attendance,
  AuditLog,
  Batch,
  ClassSchedule,
  Course,
  Enrollment,
  FeePlan,
  Instructor,
  Lesson,
  StudentProfile,
  User,
} from '../../database/entities';
import { AdminBatchesQueryDto } from './dto/admin-batches-query.dto';
import { CreateAdminBatchDto } from './dto/create-admin-batch.dto';
import { CreateBatchScheduleDto } from './dto/create-batch-schedule.dto';
import { EnrollBatchStudentDto, UpdateBatchEnrollmentStatusDto } from './dto/enroll-batch-student.dto';
import { MarkBatchAttendanceDto } from './dto/mark-batch-attendance.dto';
import { UpdateAdminBatchDto } from './dto/update-admin-batch.dto';

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch) private readonly repository: Repository<Batch>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: AdminBatchesQueryDto) {
    const builder = this.repository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.course', 'course')
      .leftJoinAndSelect('batch.instructor', 'instructor')
      .orderBy('batch.startDate', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => where.where('batch.title ILIKE :search', { search }).orWhere('batch.code ILIKE :search', { search }).orWhere('course.title ILIKE :search', { search })));
    }
    if (query.courseId) builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    if (query.status !== 'all') builder.andWhere('batch.status = :status', { status: query.status });
    if (query.mode) builder.andWhere('batch.mode = :mode', { mode: query.mode });
    const [batches, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const mapped = await this.mapBatches(batches);
    const grouped = await this.repository.createQueryBuilder('batch').select('batch.status', 'status').addSelect('COUNT(*)', 'count').groupBy('batch.status').getRawMany<{ status: string; count: string }>();
    const counts = Object.fromEntries(grouped.map((item) => [item.status, Number(item.count)]));
    const total = await this.repository.count();
    return { summary: { total, upcoming: counts.upcoming ?? 0, active: counts.active ?? 0, completed: counts.completed ?? 0, cancelled: counts.cancelled ?? 0 }, batches: mapped, pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) } };
  }

  async filterOptions() {
    const [courses, instructors] = await Promise.all([
      this.dataSource.getRepository(Course).find({ order: { title: 'ASC' } }),
      this.dataSource.getRepository(Instructor).find({ where: { isActive: true }, order: { name: 'ASC' } }),
    ]);
    return {
      courses: courses.map(({ id, title, isPublished, duration, durationMonths, durationUnit }) => ({
        id,
        title,
        isPublished,
        duration,
        durationMonths,
        durationUnit,
      })),
      instructors: instructors.map(({ id, name, specialization }) => ({ id, name, specialization: specialization ?? '' })),
    };
  }

  async findOne(id: string) {
    const batch = await this.batch(id);
    return (await this.mapBatches([batch]))[0];
  }

  async findDetail(id: string) {
    const batch = await this.batch(id);
    const [enrollments, schedules, attendance, assignments, feePlans] = await Promise.all([
      this.dataSource.getRepository(Enrollment).find({ where: { batch: { id }, status: In(['pending', 'active', 'completed']) }, relations: { student: { user: true }, course: true, batch: true }, order: { enrolledAt: 'DESC' } }),
      this.dataSource.getRepository(ClassSchedule).find({ where: { batch: { id } }, relations: { lesson: true }, order: { date: 'ASC', startTime: 'ASC' } }),
      this.dataSource.getRepository(Attendance).find({ where: { batch: { id } }, relations: { student: true, classSchedule: true }, order: { date: 'DESC' } }),
      this.dataSource.getRepository(Assignment).find({ where: { batch: { id } } }),
      this.dataSource.getRepository(FeePlan).find({ where: { enrollment: { batch: { id } } }, relations: { enrollment: { student: true, batch: true } } }),
    ]);
    const attendanceByStudent = new Map<string, Attendance[]>();
    for (const item of attendance) attendanceByStudent.set(item.student.id, [...(attendanceByStudent.get(item.student.id) ?? []), item]);
    const activeAttendance = attendance.filter((item) => ['present', 'late'].includes(item.status)).length;
    const dateGroups = new Map<string, Attendance[]>();
    for (const item of attendance) dateGroups.set(item.date, [...(dateGroups.get(item.date) ?? []), item]);
    const mappedBatch = (await this.mapBatches([batch]))[0];
    return {
      batch: mappedBatch,
      summary: {
        studentsCount: enrollments.length,
        capacity: batch.capacity,
        capacityPercentage: batch.capacity ? Math.min(100, Math.round((enrollments.length / batch.capacity) * 100)) : 0,
        averageAttendance: attendance.length ? Math.round((activeAttendance / attendance.length) * 100) : 0,
        completedClasses: schedules.filter((item) => item.status === 'completed').length,
        upcomingClasses: schedules.filter((item) => item.status === 'upcoming').length,
        pendingAssignments: assignments.filter((item) => item.isPublished).length,
      },
      students: enrollments.map((enrollment) => {
        const studentAttendance = attendanceByStudent.get(enrollment.student.id) ?? [];
        const attended = studentAttendance.filter((item) => ['present', 'late'].includes(item.status)).length;
        return {
          id: enrollment.student.id,
          studentId: enrollment.student.id,
          name: enrollment.student.user.name,
          email: enrollment.student.user.email,
          phone: enrollment.student.user.phone ?? '',
          city: enrollment.student.city ?? '',
          enrollmentId: enrollment.id,
          enrollmentStatus: enrollment.status,
          progressPercentage: Number(enrollment.progressPercentage),
          attendancePercentage: studentAttendance.length ? Math.round((attended / studentAttendance.length) * 100) : 0,
          pendingFee: feePlans.filter((plan) => plan.enrollment.id === enrollment.id).reduce((sum, plan) => sum + Number(plan.pendingAmount), 0),
        };
      }),
      schedule: schedules.map((item) => ({ id: item.id, date: item.date, lessonTitle: item.lesson?.title ?? 'Class session', startTime: item.startTime.slice(0, 5), endTime: item.endTime.slice(0, 5), mode: item.mode, status: item.status, meetingUrl: item.meetingUrl ?? '', location: item.location ?? '' })),
      attendanceRecords: Array.from(dateGroups.entries()).map(([date, records]) => ({
        id: records[0].classSchedule?.id ?? date,
        date,
        present: records.filter((item) => item.status === 'present').length,
        absent: records.filter((item) => item.status === 'absent').length,
        late: records.filter((item) => item.status === 'late').length,
        leave: records.filter((item) => item.status === 'leave').length,
        total: records.length,
      })),
    };
  }

  async enrollmentOptions(id: string, search?: string) {
    await this.batch(id);
    const enrolled = await this.dataSource.getRepository(Enrollment).find({ where: { batch: { id } }, relations: { student: true } });
    const excluded = enrolled.map((item) => item.student.id);
    const builder = this.dataSource.getRepository(StudentProfile).createQueryBuilder('student').leftJoinAndSelect('student.user', 'user').where('student.status = :status', { status: 'active' }).orderBy('user.name', 'ASC').take(50);
    if (excluded.length) builder.andWhere('student.id NOT IN (:...excluded)', { excluded });
    if (search?.trim()) builder.andWhere('(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)', { search: `%${search.trim()}%` });
    const students = await builder.getMany();
    return students.map((student) => ({ id: student.id, name: student.user.name, email: student.user.email, phone: student.user.phone ?? '', city: student.city ?? '' }));
  }

  async create(dto: CreateAdminBatchDto, actorId: string) {
    await this.validateDates(dto.startDate, dto.endDate, dto.startTime, dto.endTime);
    const code = dto.code.trim().toUpperCase();
    await this.ensureCode(code);
    const course = await this.course(dto.courseId);
    const instructor = await this.instructor(dto.instructorId);
    const batch = await this.repository.save(this.repository.create({ ...dto, code, title: dto.title.trim(), course, instructor, meetingUrl: dto.meetingUrl?.trim() || undefined, location: dto.location?.trim() || undefined, enrollmentNote: dto.enrollmentNote?.trim() || undefined }));
    await this.log(actorId, 'create', batch.id, { code, courseId: course.id });
    return this.findOne(batch.id);
  }

  async update(id: string, dto: UpdateAdminBatchDto, actorId: string) {
    const batch = await this.batch(id);
    await this.validateDates(dto.startDate ?? batch.startDate, dto.endDate ?? batch.endDate, dto.startTime ?? batch.startTime, dto.endTime ?? batch.endTime);
    if (dto.code) { const code = dto.code.trim().toUpperCase(); await this.ensureCode(code, id); batch.code = code; }
    if (dto.courseId) batch.course = await this.course(dto.courseId);
    if (dto.instructorId !== undefined) batch.instructor = await this.instructor(dto.instructorId);
    const fields: Array<keyof UpdateAdminBatchDto> = ['title', 'startDate', 'endDate', 'classDays', 'startTime', 'endTime', 'mode', 'capacity', 'status', 'meetingUrl', 'location', 'enrollmentNote'];
    for (const field of fields) if (dto[field] !== undefined) (batch as unknown as Record<string, unknown>)[field] = typeof dto[field] === 'string' ? (dto[field] as string).trim() || undefined : dto[field];
    await this.repository.save(batch);
    await this.log(actorId, 'update', id, { fields: Object.keys(dto) });
    return this.findOne(id);
  }

  async enrollStudent(id: string, dto: EnrollBatchStudentDto, actorId: string) {
    const batch = await this.batch(id);
    const repository = this.dataSource.getRepository(Enrollment);
    const count = await repository.count({ where: { batch: { id }, status: In(['pending', 'active']) } });
    if (count >= batch.capacity) throw new ConflictException('Batch capacity has been reached');
    const student = await this.dataSource.getRepository(StudentProfile).findOne({ where: { id: dto.studentId, status: 'active' } });
    if (!student) throw new BadRequestException('Active student not found');
    const existing = await repository.findOne({ where: { student: { id: dto.studentId }, course: { id: batch.course.id } } });
    if (existing) throw new ConflictException('Student is already enrolled in this course');
    const enrollment = await repository.save(repository.create({ student, course: batch.course, batch, status: dto.status, progressPercentage: 0 }));
    await this.log(actorId, 'enroll_student', id, { studentId: dto.studentId, enrollmentId: enrollment.id });
    return { message: 'Student enrolled successfully', enrollmentId: enrollment.id };
  }

  async updateEnrollmentStatus(id: string, studentId: string, dto: UpdateBatchEnrollmentStatusDto, actorId: string) {
    const enrollment = await this.dataSource.getRepository(Enrollment).findOne({ where: { batch: { id }, student: { id: studentId } } });
    if (!enrollment) throw new NotFoundException('Batch enrollment not found');
    enrollment.status = dto.status;
    if (dto.status === 'completed') enrollment.completedAt = new Date();
    await this.dataSource.getRepository(Enrollment).save(enrollment);
    await this.log(actorId, 'update_enrollment_status', id, { studentId, status: dto.status });
    return { message: 'Enrollment status updated successfully', status: dto.status };
  }

  async removeStudent(id: string, studentId: string, actorId: string) {
    const repository = this.dataSource.getRepository(Enrollment);
    const enrollment = await repository.findOne({ where: { batch: { id }, student: { id: studentId } } });
    if (!enrollment) throw new NotFoundException('Batch enrollment not found');
    const [fees, attendance] = await Promise.all([
      this.dataSource.getRepository(FeePlan).count({ where: { enrollment: { id: enrollment.id } } }),
      this.dataSource.getRepository(Attendance).count({ where: { batch: { id }, student: { id: studentId } } }),
    ]);
    if (fees || attendance) throw new ConflictException('This enrollment has fee or attendance records. Change its status instead.');
    await repository.remove(enrollment);
    await this.log(actorId, 'remove_student', id, { studentId });
    return { message: 'Student removed from batch' };
  }

  async markAttendance(id: string, dto: MarkBatchAttendanceDto, actorId: string) {
    const batch = await this.batch(id);
    const enrollmentIds = new Set((await this.dataSource.getRepository(Enrollment).find({ where: { batch: { id }, status: In(['pending', 'active']) }, relations: { student: true } })).map((item) => item.student.id));
    if (dto.records.some((item) => !enrollmentIds.has(item.studentId))) throw new BadRequestException('Attendance can only be marked for students enrolled in this batch');
    let schedule: ClassSchedule | undefined;
    if (dto.classScheduleId) {
      schedule = (await this.dataSource.getRepository(ClassSchedule).findOne({ where: { id: dto.classScheduleId, batch: { id } } })) ?? undefined;
      if (!schedule) throw new BadRequestException('Class schedule not found for this batch');
    }
    await this.dataSource.transaction(async (manager) => {
      for (const record of dto.records) {
        let attendance = await manager.findOne(Attendance, { where: { batch: { id }, student: { id: record.studentId }, date: dto.date } });
        if (!attendance) attendance = manager.create(Attendance, { student: { id: record.studentId } as StudentProfile, batch, course: batch.course, date: dto.date });
        attendance.status = record.status;
        attendance.remarks = record.remarks?.trim() || undefined;
        attendance.classSchedule = schedule;
        attendance.markedBy = { id: actorId } as User;
        await manager.save(attendance);
      }
    });
    await this.log(actorId, 'mark_attendance', id, { date: dto.date, records: dto.records.length });
    return { message: 'Attendance marked successfully', recordsCount: dto.records.length };
  }

  async createSchedule(id: string, dto: CreateBatchScheduleDto, actorId: string) {
    const batch = await this.batch(id);
    await this.validateDates(dto.date, dto.date, dto.startTime, dto.endTime);
    let lesson: Lesson | undefined;
    if (dto.lessonId) {
      lesson = (await this.dataSource.getRepository(Lesson).findOne({ where: { id: dto.lessonId, course: { id: batch.course.id } } })) ?? undefined;
      if (!lesson) throw new BadRequestException('Lesson does not belong to the batch course');
    }
    const schedule = await this.dataSource.getRepository(ClassSchedule).save({ batch, course: batch.course, lesson, date: dto.date, startTime: dto.startTime, endTime: dto.endTime, mode: dto.mode, meetingUrl: dto.meetingUrl?.trim() || undefined, location: dto.location?.trim() || undefined, status: dto.status ?? 'upcoming' });
    await this.log(actorId, 'create_schedule', id, { scheduleId: schedule.id, date: dto.date });
    return { message: 'Class schedule created successfully', scheduleId: schedule.id };
  }

  async updateScheduleStatus(id: string, scheduleId: string, status: 'upcoming' | 'completed' | 'cancelled', actorId: string) {
    const repository = this.dataSource.getRepository(ClassSchedule);
    const schedule = await repository.findOne({ where: { id: scheduleId, batch: { id } } });
    if (!schedule) throw new NotFoundException('Class schedule not found');
    schedule.status = status;
    await repository.save(schedule);
    await this.log(actorId, 'update_schedule_status', id, { scheduleId, status });
    return { message: 'Class schedule updated successfully', status };
  }

  async updateStatus(id: string, status: 'upcoming' | 'active' | 'completed' | 'cancelled', actorId: string) { const batch = await this.repository.findOne({ where: { id } }); if (!batch) throw new NotFoundException('Batch not found'); batch.status = status; await this.repository.save(batch); await this.log(actorId, 'update_status', id, { status }); return { message: `Batch status updated to ${status}`, status }; }

  async remove(id: string, actorId: string) { const batch = await this.repository.findOne({ where: { id } }); if (!batch) throw new NotFoundException('Batch not found'); const repository = this.dataSource.getRepository(Enrollment); const activeCount = await repository.count({ where: { batch: { id }, status: In(['pending', 'active']) } }); if (activeCount) throw new ConflictException('This batch has active or pending students. Cancel the batch instead.'); const totalCount = await repository.count({ where: { batch: { id } } }); if (totalCount) throw new ConflictException('This batch has historical enrollment records. Keep it cancelled/completed instead of deleting it.'); await this.repository.remove(batch); await this.log(actorId, 'delete', id, { code: batch.code }); return { message: 'Batch deleted successfully' }; }

  private async mapBatches(batches: Batch[]) { if (!batches.length) return []; const enrollments = await this.dataSource.getRepository(Enrollment).find({ where: { batch: { id: In(batches.map((item) => item.id)) }, status: In(['pending', 'active']) }, relations: { batch: true } }); return batches.map((batch) => ({ id: batch.id, title: batch.title, code: batch.code, courseId: batch.course.id, courseTitle: batch.course.title, instructorId: batch.instructor?.id ?? '', instructorName: batch.instructor?.name ?? '', startDate: batch.startDate, endDate: batch.endDate ?? '', classDays: batch.classDays, startTime: batch.startTime?.slice(0, 5) ?? '', endTime: batch.endTime?.slice(0, 5) ?? '', mode: batch.mode, capacity: batch.capacity, studentsCount: enrollments.filter((item) => item.batch?.id === batch.id).length, status: batch.status, meetingUrl: batch.meetingUrl ?? '', location: batch.location ?? '', enrollmentNote: batch.enrollmentNote ?? '', createdAt: batch.createdAt, updatedAt: batch.updatedAt })); }
  private async batch(id: string) { const item = await this.repository.findOne({ where: { id }, relations: { course: true, instructor: true } }); if (!item) throw new NotFoundException('Batch not found'); return item; }
  private async course(id: string) { const item = await this.dataSource.getRepository(Course).findOne({ where: { id } }); if (!item) throw new BadRequestException('Course not found'); return item; }
  private async instructor(id?: string) { if (!id) return undefined; const item = await this.dataSource.getRepository(Instructor).findOne({ where: { id, isActive: true } }); if (!item) throw new BadRequestException('Instructor not found'); return item; }
  private async ensureCode(code: string, excludedId?: string) { const item = await this.repository.findOne({ where: { code } }); if (item && item.id !== excludedId) throw new ConflictException('A batch with this code already exists'); }
  private async validateDates(startDate: string, endDate?: string, startTime?: string, endTime?: string) { if (endDate && endDate < startDate) throw new BadRequestException('End date must be on or after the start date'); if (startTime && endTime && endTime <= startTime) throw new BadRequestException('End time must be after the start time'); }
  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) { await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'batches', recordId, metadata }); }
}
