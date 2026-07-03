import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource } from 'typeorm';
import { Attendance, AuditLog, Batch, ClassSchedule, Enrollment, StudentProfile, User } from '../../database/entities';
import { AdminAttendanceQueryDto } from './dto/admin-attendance-query.dto';
import { AttendanceMarkDataQueryDto } from './dto/attendance-mark-data-query.dto';
import { MarkAdminAttendanceDto } from './dto/mark-admin-attendance.dto';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(query: AdminAttendanceQueryDto) {
    const repository = this.dataSource.getRepository(Attendance);
    const builder = repository.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('attendance.course', 'course')
      .leftJoinAndSelect('attendance.batch', 'batch')
      .leftJoinAndSelect('attendance.markedBy', 'markedBy')
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.createdAt', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => {
        where.where('user.name ILIKE :search', { search }).orWhere('user.email ILIKE :search', { search }).orWhere('batch.title ILIKE :search', { search }).orWhere('course.title ILIKE :search', { search });
      }));
    }
    if (query.courseId) builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    if (query.batchId) builder.andWhere('batch.id = :batchId', { batchId: query.batchId });
    if (query.studentId) builder.andWhere('student.id = :studentId', { studentId: query.studentId });
    if (query.date) builder.andWhere('attendance.date = :date', { date: query.date });
    if (query.status !== 'all') builder.andWhere('attendance.status = :status', { status: query.status });
    const [records, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const grouped = await repository.createQueryBuilder('attendance').select('attendance.status', 'status').addSelect('COUNT(*)', 'count').groupBy('attendance.status').getRawMany<{ status: string; count: string }>();
    const counts = Object.fromEntries(grouped.map((item) => [item.status, Number(item.count)]));
    const totalRecords = await repository.count();
    const active = (counts.present ?? 0) + (counts.late ?? 0);
    return {
      summary: { totalRecords, present: counts.present ?? 0, absent: counts.absent ?? 0, late: counts.late ?? 0, leave: counts.leave ?? 0, averageAttendance: totalRecords ? Math.round((active / totalRecords) * 100) : 0 },
      records: records.map((item) => this.mapRecord(item)),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) },
    };
  }

  async markData(query: AttendanceMarkDataQueryDto) {
    const batch = await this.dataSource.getRepository(Batch).findOne({ where: { id: query.batchId }, relations: { course: true } });
    if (!batch) throw new NotFoundException('Batch not found');
    const [enrollments, attendance] = await Promise.all([
      this.dataSource.getRepository(Enrollment).find({ where: { batch: { id: query.batchId } }, relations: { student: { user: true } }, order: { enrolledAt: 'ASC' } }),
      this.dataSource.getRepository(Attendance).find({ where: { batch: { id: query.batchId }, date: query.date }, relations: { student: true } }),
    ]);
    return {
      batch: { id: batch.id, title: batch.title, courseTitle: batch.course.title, courseId: batch.course.id, date: query.date },
      students: enrollments.map((enrollment) => {
        const existing = attendance.find((item) => item.student.id === enrollment.student.id);
        return {
          studentId: enrollment.student.id,
          name: enrollment.student.user.name,
          email: enrollment.student.user.email,
          phone: enrollment.student.user.phone ?? '',
          existingStatus: existing?.status ?? 'present',
          remarks: existing?.remarks ?? '',
        };
      }),
    };
  }

  async mark(dto: MarkAdminAttendanceDto, actorId: string) {
    const batch = await this.dataSource.getRepository(Batch).findOne({ where: { id: dto.batchId }, relations: { course: true } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (dto.courseId && dto.courseId !== batch.course.id) throw new BadRequestException('Batch does not belong to selected course');
    const enrollments = await this.dataSource.getRepository(Enrollment).find({ where: { batch: { id: dto.batchId } }, relations: { student: true } });
    const enrolledIds = new Set(enrollments.map((item) => item.student.id));
    if (dto.records.some((item) => !enrolledIds.has(item.studentId))) throw new BadRequestException('Attendance can only be marked for students enrolled in this batch');
    let schedule: ClassSchedule | undefined;
    if (dto.classScheduleId) {
      schedule = (await this.dataSource.getRepository(ClassSchedule).findOne({ where: { id: dto.classScheduleId, batch: { id: dto.batchId } } })) ?? undefined;
      if (!schedule) throw new BadRequestException('Class schedule not found for this batch');
    }
    await this.dataSource.transaction(async (manager) => {
      for (const record of dto.records) {
        let attendance = await manager.findOne(Attendance, { where: { batch: { id: dto.batchId }, student: { id: record.studentId }, date: dto.date } });
        if (!attendance) attendance = manager.create(Attendance, { student: { id: record.studentId } as StudentProfile, batch, course: batch.course, date: dto.date });
        attendance.status = record.status;
        attendance.remarks = record.remarks?.trim() || undefined;
        attendance.classSchedule = schedule;
        attendance.markedBy = { id: actorId } as User;
        await manager.save(attendance);
      }
      await manager.save(AuditLog, manager.create(AuditLog, { user: { id: actorId } as User, action: 'mark', module: 'attendance', recordId: dto.batchId, metadata: { date: dto.date, records: dto.records.length } }));
    });
    return { message: 'Attendance marked successfully', recordsCount: dto.records.length };
  }

  async update(id: string, dto: UpdateAttendanceRecordDto, actorId: string) {
    const repository = this.dataSource.getRepository(Attendance);
    const record = await repository.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');
    record.status = dto.status;
    record.remarks = dto.remarks?.trim() || undefined;
    record.markedBy = { id: actorId } as User;
    await repository.save(record);
    await this.log(actorId, 'update', id, { status: dto.status });
    return { message: 'Attendance record updated successfully', status: record.status };
  }

  async remove(id: string, actorId: string) {
    const repository = this.dataSource.getRepository(Attendance);
    const record = await repository.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');
    await repository.remove(record);
    await this.log(actorId, 'delete', id);
    return { message: 'Attendance record deleted successfully' };
  }

  private mapRecord(item: Attendance) {
    return {
      id: item.id,
      studentId: item.student.id,
      studentName: item.student.user.name,
      courseTitle: item.course?.title ?? '',
      batchTitle: item.batch.title,
      date: item.date,
      status: item.status,
      remarks: item.remarks ?? '',
      markedByName: item.markedBy?.name ?? 'SystemGrid Academy',
    };
  }

  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) {
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'attendance', recordId, metadata });
  }
}
