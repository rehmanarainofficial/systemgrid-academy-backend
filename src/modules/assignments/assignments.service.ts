import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { Assignment, AssignmentSubmission, AuditLog, Batch, Course, CourseModule, User } from '../../database/entities';
import { AdminAssignmentsQueryDto } from './dto/admin-assignments-query.dto';
import { CreateAdminAssignmentDto } from './dto/create-admin-assignment.dto';
import { UpdateAdminAssignmentDto } from './dto/update-admin-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(@InjectRepository(Assignment) private readonly repository: Repository<Assignment>, private readonly dataSource: DataSource) {}

  async findAll(query: AdminAssignmentsQueryDto) {
    const builder = this.repository.createQueryBuilder('assignment').leftJoinAndSelect('assignment.course', 'course').leftJoinAndSelect('assignment.batch', 'batch').leftJoinAndSelect('assignment.module', 'module').orderBy('assignment.dueDate', 'ASC').addOrderBy('assignment.createdAt', 'DESC');
    if (query.search?.trim()) { const search = `%${query.search.trim()}%`; builder.andWhere(new Brackets((where) => where.where('assignment.title ILIKE :search', { search }).orWhere('assignment.description ILIKE :search', { search }).orWhere('course.title ILIKE :search', { search }).orWhere('batch.title ILIKE :search', { search }))); }
    if (query.courseId) builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    if (query.batchId) builder.andWhere('batch.id = :batchId', { batchId: query.batchId });
    if (query.status === 'published') builder.andWhere('assignment.isPublished = true');
    if (query.status === 'draft') builder.andWhere('assignment.isPublished = false');
    const [assignments, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const ids = assignments.map((item) => item.id);
    const submissions = ids.length ? await this.dataSource.getRepository(AssignmentSubmission).find({ where: { assignment: { id: In(ids) } }, relations: { assignment: true } }) : [];
    const [total, published, pendingReview] = await Promise.all([this.repository.count(), this.repository.count({ where: { isPublished: true } }), this.dataSource.getRepository(AssignmentSubmission).count({ where: [{ status: 'submitted' }, { status: 'late' }] })]);
    return { summary: { total, published, draft: total - published, submissionsPendingReview: pendingReview }, assignments: assignments.map((item) => this.map(item, submissions.filter((submission) => submission.assignment.id === item.id))), pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) } };
  }

  async filterOptions() {
    const courses = await this.dataSource.getRepository(Course).find({ relations: { modules: true }, order: { title: 'ASC', modules: { sortOrder: 'ASC' } } });
    const batches = await this.dataSource.getRepository(Batch).find({ relations: { course: true }, order: { startDate: 'DESC' } });
    return { courses: courses.map((course) => ({ id: course.id, title: course.title, modules: (course.modules ?? []).map((module) => ({ id: module.id, title: module.title, sortOrder: module.sortOrder })) })), batches: batches.map((batch) => ({ id: batch.id, title: batch.title, code: batch.code, courseId: batch.course.id, status: batch.status })) };
  }

  async findOne(id: string) { const assignment = await this.assignment(id); const submissions = await this.dataSource.getRepository(AssignmentSubmission).find({ where: { assignment: { id } }, relations: { assignment: true } }); return this.map(assignment, submissions); }

  async submissions(id: string) {
    const assignment = await this.assignment(id);
    const submissions = await this.dataSource.getRepository(AssignmentSubmission).find({ where: { assignment: { id } }, relations: { student: { user: true } }, order: { submittedAt: 'DESC' } });
    return { assignment: { id: assignment.id, title: assignment.title, totalMarks: assignment.totalMarks }, submissions: submissions.map((item) => ({ id: item.id, studentId: item.student.id, studentName: item.student.user.name, studentEmail: item.student.user.email, textAnswer: item.textAnswer ?? '', fileUrl: item.fileUrl ?? '', marksObtained: item.marksObtained === undefined ? null : Number(item.marksObtained), feedback: item.feedback ?? '', status: item.status, submittedAt: item.submittedAt, checkedAt: item.checkedAt ?? null })) };
  }

  async create(dto: CreateAdminAssignmentDto, actorId: string) {
    const relations = await this.validateOwnership(dto.courseId, dto.batchId, dto.moduleId);
    const assignment = await this.repository.save(this.repository.create({ ...dto, title: dto.title.trim(), description: dto.description.trim(), attachmentUrl: dto.attachmentUrl?.trim() || undefined, dueDate: new Date(dto.dueDate), ...relations }));
    await this.log(actorId, 'create', assignment.id, { courseId: dto.courseId, batchId: dto.batchId });
    return this.findOne(assignment.id);
  }

  async update(id: string, dto: UpdateAdminAssignmentDto, actorId: string) {
    const assignment = await this.assignment(id);
    const courseId = dto.courseId ?? assignment.course.id;
    const batchId = dto.batchId ?? assignment.batch?.id;
    if (!batchId) throw new BadRequestException('Batch is required');
    const moduleId = dto.moduleId === undefined ? assignment.module?.id : dto.moduleId;
    const relations = await this.validateOwnership(courseId, batchId, moduleId);
    assignment.course = relations.course; assignment.batch = relations.batch; assignment.module = relations.module;
    const fields: Array<keyof UpdateAdminAssignmentDto> = ['title', 'description', 'attachmentUrl', 'totalMarks', 'isPublished'];
    for (const field of fields) if (dto[field] !== undefined) (assignment as unknown as Record<string, unknown>)[field] = typeof dto[field] === 'string' ? (dto[field] as string).trim() || undefined : dto[field];
    if (dto.dueDate) assignment.dueDate = new Date(dto.dueDate);
    await this.repository.save(assignment);
    await this.log(actorId, 'update', id, { fields: Object.keys(dto) });
    return this.findOne(id);
  }

  async setPublished(id: string, isPublished: boolean, actorId: string) { const assignment = await this.assignment(id); assignment.isPublished = isPublished; await this.repository.save(assignment); await this.log(actorId, isPublished ? 'publish' : 'unpublish', id); return { message: `Assignment ${isPublished ? 'published' : 'unpublished'} successfully`, isPublished }; }
  async remove(id: string, actorId: string) { const assignment = await this.assignment(id); const submissions = await this.dataSource.getRepository(AssignmentSubmission).count({ where: { assignment: { id } } }); if (submissions) throw new ConflictException('This assignment has submissions. Unpublish it instead.'); await this.repository.remove(assignment); await this.log(actorId, 'delete', id, { title: assignment.title }); return { message: 'Assignment deleted successfully' }; }

  private async assignment(id: string) { const assignment = await this.repository.findOne({ where: { id }, relations: { course: true, batch: true, module: true } }); if (!assignment) throw new NotFoundException('Assignment not found'); return assignment; }
  private async validateOwnership(courseId: string, batchId: string, moduleId?: string) { const course = await this.dataSource.getRepository(Course).findOne({ where: { id: courseId } }); if (!course) throw new BadRequestException('Course not found'); const batch = await this.dataSource.getRepository(Batch).findOne({ where: { id: batchId, course: { id: courseId } }, relations: { course: true } }); if (!batch) throw new BadRequestException('Batch does not belong to the selected course'); let module: CourseModule | undefined; if (moduleId) { module = (await this.dataSource.getRepository(CourseModule).findOne({ where: { id: moduleId, course: { id: courseId } } })) ?? undefined; if (!module) throw new BadRequestException('Module does not belong to the selected course'); } return { course, batch, module }; }
  private map(assignment: Assignment, submissions: AssignmentSubmission[]) { return { id: assignment.id, title: assignment.title, description: assignment.description ?? '', courseId: assignment.course.id, courseTitle: assignment.course.title, batchId: assignment.batch?.id ?? '', batchTitle: assignment.batch?.title ?? '', moduleId: assignment.module?.id ?? '', moduleTitle: assignment.module?.title ?? '', dueDate: assignment.dueDate?.toISOString() ?? '', totalMarks: assignment.totalMarks, attachmentUrl: assignment.attachmentUrl ?? '', isPublished: assignment.isPublished, submissionsCount: submissions.length, checkedCount: submissions.filter((item) => item.status === 'checked').length, pendingReviewCount: submissions.filter((item) => ['submitted', 'late'].includes(item.status)).length, createdAt: assignment.createdAt, updatedAt: assignment.updatedAt }; }
  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) { await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'assignments', recordId, metadata }); }
}
