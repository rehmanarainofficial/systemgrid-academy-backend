import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { AuditLog, Batch, Course, Enrollment, Instructor, User } from '../../database/entities';
import { AdminBatchesQueryDto } from './dto/admin-batches-query.dto';
import { CreateAdminBatchDto } from './dto/create-admin-batch.dto';
import { UpdateAdminBatchDto } from './dto/update-admin-batch.dto';

@Injectable()
export class BatchesService {
  constructor(@InjectRepository(Batch) private readonly repository: Repository<Batch>, private readonly dataSource: DataSource) {}

  async findAll(query: AdminBatchesQueryDto) {
    const builder = this.repository.createQueryBuilder('batch').leftJoinAndSelect('batch.course', 'course').leftJoinAndSelect('batch.instructor', 'instructor').orderBy('batch.startDate', 'DESC');
    if (query.search?.trim()) { const search = `%${query.search.trim()}%`; builder.andWhere(new Brackets((where) => where.where('batch.title ILIKE :search', { search }).orWhere('batch.code ILIKE :search', { search }).orWhere('course.title ILIKE :search', { search }))); }
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
    return { courses: courses.map(({ id, title }) => ({ id, title })), instructors: instructors.map(({ id, name, specialization }) => ({ id, name, specialization: specialization ?? '' })) };
  }

  async findOne(id: string) { const batch = await this.repository.findOne({ where: { id }, relations: { course: true, instructor: true } }); if (!batch) throw new NotFoundException('Batch not found'); return (await this.mapBatches([batch]))[0]; }

  async create(dto: CreateAdminBatchDto, actorId: string) {
    await this.validateDates(dto.startDate, dto.endDate, dto.startTime, dto.endTime);
    const code = dto.code.trim().toUpperCase(); await this.ensureCode(code);
    const course = await this.course(dto.courseId); const instructor = await this.instructor(dto.instructorId);
    const batch = await this.repository.save(this.repository.create({ ...dto, code, title: dto.title.trim(), course, instructor }));
    await this.log(actorId, 'create', batch.id, { code, courseId: course.id }); return this.findOne(batch.id);
  }

  async update(id: string, dto: UpdateAdminBatchDto, actorId: string) {
    const batch = await this.repository.findOne({ where: { id }, relations: { course: true, instructor: true } }); if (!batch) throw new NotFoundException('Batch not found');
    await this.validateDates(dto.startDate ?? batch.startDate, dto.endDate ?? batch.endDate, dto.startTime ?? batch.startTime, dto.endTime ?? batch.endTime);
    if (dto.code) { const code = dto.code.trim().toUpperCase(); await this.ensureCode(code, id); batch.code = code; }
    if (dto.courseId) batch.course = await this.course(dto.courseId);
    if (dto.instructorId !== undefined) batch.instructor = await this.instructor(dto.instructorId);
    const fields: Array<keyof UpdateAdminBatchDto> = ['title', 'startDate', 'endDate', 'classDays', 'startTime', 'endTime', 'mode', 'capacity', 'status'];
    for (const field of fields) if (dto[field] !== undefined) (batch as unknown as Record<string, unknown>)[field] = dto[field];
    await this.repository.save(batch); await this.log(actorId, 'update', id, { fields: Object.keys(dto) }); return this.findOne(id);
  }

  async updateStatus(id: string, status: 'upcoming' | 'active' | 'completed' | 'cancelled', actorId: string) { const batch = await this.repository.findOne({ where: { id } }); if (!batch) throw new NotFoundException('Batch not found'); batch.status = status; await this.repository.save(batch); await this.log(actorId, 'update_status', id, { status }); return { message: `Batch status updated to ${status}`, status }; }

  async remove(id: string, actorId: string) { const batch = await this.repository.findOne({ where: { id } }); if (!batch) throw new NotFoundException('Batch not found'); const count = await this.dataSource.getRepository(Enrollment).count({ where: { batch: { id } } }); if (count) throw new ConflictException('This batch has enrolled students. Cancel the batch instead.'); await this.repository.remove(batch); await this.log(actorId, 'delete', id, { code: batch.code }); return { message: 'Batch deleted successfully' }; }

  private async mapBatches(batches: Batch[]) { if (!batches.length) return []; const enrollments = await this.dataSource.getRepository(Enrollment).find({ where: { batch: { id: In(batches.map((item) => item.id)) } }, relations: { batch: true } }); return batches.map((batch) => ({ id: batch.id, title: batch.title, code: batch.code, courseId: batch.course.id, courseTitle: batch.course.title, instructorId: batch.instructor?.id ?? '', instructorName: batch.instructor?.name ?? '', startDate: batch.startDate, endDate: batch.endDate ?? '', classDays: batch.classDays, startTime: batch.startTime?.slice(0, 5) ?? '', endTime: batch.endTime?.slice(0, 5) ?? '', mode: batch.mode, capacity: batch.capacity, studentsCount: enrollments.filter((item) => item.batch?.id === batch.id).length, status: batch.status, createdAt: batch.createdAt, updatedAt: batch.updatedAt })); }
  private async course(id: string) { const item = await this.dataSource.getRepository(Course).findOne({ where: { id } }); if (!item) throw new BadRequestException('Course not found'); return item; }
  private async instructor(id?: string) { if (!id) return undefined; const item = await this.dataSource.getRepository(Instructor).findOne({ where: { id, isActive: true } }); if (!item) throw new BadRequestException('Instructor not found'); return item; }
  private async ensureCode(code: string, excludedId?: string) { const item = await this.repository.findOne({ where: { code } }); if (item && item.id !== excludedId) throw new ConflictException('A batch with this code already exists'); }
  private async validateDates(startDate: string, endDate?: string, startTime?: string, endTime?: string) { if (endDate && endDate < startDate) throw new BadRequestException('End date must be on or after the start date'); if (startTime && endTime && endTime <= startTime) throw new BadRequestException('End time must be after the start time'); }
  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) { await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'batches', recordId, metadata }); }
}
