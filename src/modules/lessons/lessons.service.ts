import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AuditLog, ClassSchedule, Course, CourseModule, Lesson, User } from '../../database/entities';
import { AdminLessonsQueryDto } from './dto/admin-lessons-query.dto';
import { CreateAdminLessonDto } from './dto/create-admin-lesson.dto';
import { UpdateAdminLessonDto } from './dto/update-admin-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(@InjectRepository(Lesson) private readonly repository: Repository<Lesson>, private readonly dataSource: DataSource) {}

  async findAll(query: AdminLessonsQueryDto) {
    const builder = this.repository.createQueryBuilder('lesson').leftJoinAndSelect('lesson.course', 'course').leftJoinAndSelect('lesson.module', 'module').orderBy('course.title', 'ASC').addOrderBy('module.sortOrder', 'ASC').addOrderBy('lesson.sortOrder', 'ASC');
    if (query.search?.trim()) { const search = `%${query.search.trim()}%`; builder.andWhere(new Brackets((where) => where.where('lesson.title ILIKE :search', { search }).orWhere('lesson.description ILIKE :search', { search }).orWhere('course.title ILIKE :search', { search }).orWhere('module.title ILIKE :search', { search }))); }
    if (query.courseId) builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    if (query.moduleId) builder.andWhere('module.id = :moduleId', { moduleId: query.moduleId });
    if (query.status === 'published') builder.andWhere('lesson.isPublished = true');
    if (query.status === 'draft') builder.andWhere('lesson.isPublished = false');
    if (query.preview === 'preview') builder.andWhere('lesson.isPreview = true');
    if (query.preview === 'normal') builder.andWhere('lesson.isPreview = false');
    const [lessons, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const [total, published, preview] = await Promise.all([this.repository.count(), this.repository.count({ where: { isPublished: true } }), this.repository.count({ where: { isPreview: true } })]);
    return { summary: { total, published, draft: total - published, preview }, lessons: lessons.map((lesson) => this.map(lesson)), pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) } };
  }

  async filterOptions() {
    const courses = await this.dataSource.getRepository(Course).find({ relations: { modules: true }, order: { title: 'ASC', modules: { sortOrder: 'ASC' } } });
    return { courses: courses.map((course) => ({ id: course.id, title: course.title, isPublished: course.isPublished, modules: (course.modules ?? []).map((module) => ({ id: module.id, title: module.title, sortOrder: module.sortOrder })) })) };
  }

  async findOne(id: string) { return this.map(await this.lesson(id)); }

  async create(dto: CreateAdminLessonDto, actorId: string) {
    const { course, module } = await this.validateOwnership(dto.courseId, dto.moduleId);
    const lesson = await this.repository.save(this.repository.create({ ...dto, title: dto.title.trim(), description: dto.description?.trim() || undefined, videoUrl: dto.videoUrl?.trim() || undefined, resourceUrl: dto.resourceUrl?.trim() || undefined, course, module }));
    await this.log(actorId, 'create', lesson.id, { courseId: course.id, moduleId: module.id });
    return this.findOne(lesson.id);
  }

  async update(id: string, dto: UpdateAdminLessonDto, actorId: string) {
    const lesson = await this.lesson(id);
    const courseId = dto.courseId ?? lesson.course.id;
    const moduleId = dto.moduleId ?? lesson.module?.id;
    if (!moduleId) throw new BadRequestException('Course module is required');
    const { course, module } = await this.validateOwnership(courseId, moduleId);
    lesson.course = course; lesson.module = module;
    const fields: Array<keyof UpdateAdminLessonDto> = ['title', 'description', 'videoUrl', 'resourceUrl', 'durationMinutes', 'sortOrder', 'isPreview', 'isPublished'];
    for (const field of fields) if (dto[field] !== undefined) (lesson as unknown as Record<string, unknown>)[field] = typeof dto[field] === 'string' ? (dto[field] as string).trim() || undefined : dto[field];
    await this.repository.save(lesson);
    await this.log(actorId, 'update', id, { fields: Object.keys(dto) });
    return this.findOne(id);
  }

  async setPublished(id: string, isPublished: boolean, actorId: string) { const lesson = await this.lesson(id); lesson.isPublished = isPublished; await this.repository.save(lesson); await this.log(actorId, isPublished ? 'publish' : 'unpublish', id); return { message: `Lesson ${isPublished ? 'published' : 'unpublished'} successfully`, isPublished }; }

  async remove(id: string, actorId: string) { const lesson = await this.lesson(id); const schedules = await this.dataSource.getRepository(ClassSchedule).count({ where: { lesson: { id } } }); if (schedules) throw new ConflictException('This lesson is used in class schedules. Unpublish it instead.'); await this.repository.remove(lesson); await this.log(actorId, 'delete', id, { title: lesson.title }); return { message: 'Lesson deleted successfully' }; }

  private async lesson(id: string) { const lesson = await this.repository.findOne({ where: { id }, relations: { course: true, module: true } }); if (!lesson) throw new NotFoundException('Lesson not found'); return lesson; }
  private async validateOwnership(courseId: string, moduleId: string) { const course = await this.dataSource.getRepository(Course).findOne({ where: { id: courseId } }); if (!course) throw new BadRequestException('Course not found'); const module = await this.dataSource.getRepository(CourseModule).findOne({ where: { id: moduleId, course: { id: courseId } }, relations: { course: true } }); if (!module) throw new BadRequestException('Module does not belong to the selected course'); return { course, module }; }
  private map(lesson: Lesson) { return { id: lesson.id, title: lesson.title, description: lesson.description ?? '', courseId: lesson.course.id, courseTitle: lesson.course.title, moduleId: lesson.module?.id ?? '', moduleTitle: lesson.module?.title ?? '', videoUrl: lesson.videoUrl ?? '', resourceUrl: lesson.resourceUrl ?? '', durationMinutes: lesson.durationMinutes ?? 0, isPreview: lesson.isPreview, sortOrder: lesson.sortOrder, isPublished: lesson.isPublished, createdAt: lesson.createdAt, updatedAt: lesson.updatedAt }; }
  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) { await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'lessons', recordId, metadata }); }
}
