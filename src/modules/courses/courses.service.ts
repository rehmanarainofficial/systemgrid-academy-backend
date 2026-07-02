import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, ILike, In, Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  AuditLog,
  Batch,
  Course,
  CourseCategory,
  CourseModule,
  Enrollment,
  Lesson,
  User,
} from '../../database/entities';
import { AdminCoursesQueryDto } from './dto/admin-courses-query.dto';
import { CreateAdminCourseDto } from './dto/create-admin-course.dto';
import { UpdateAdminCourseDto } from './dto/update-admin-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    private readonly dataSource: DataSource,
  ) {}

  async findPublicCourses(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.search
      ? [
          { isPublished: true, title: ILike(`%${query.search}%`) },
          { isPublished: true, shortDescription: ILike(`%${query.search}%`) },
        ]
      : { isPublished: true };
    const [items, total] = await this.coursesRepository.findAndCount({
      where,
      relations: { category: true },
      order: { isFeatured: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async findPublicCourseBySlug(slug: string) {
    const course = await this.coursesRepository.findOne({
      where: { slug, isPublished: true },
      relations: { category: true, modules: true, lessons: true },
      order: { modules: { sortOrder: 'ASC' }, lessons: { sortOrder: 'ASC' } },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async findAdminCourses(query: AdminCoursesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .orderBy('course.createdAt', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => where
        .where('course.title ILIKE :search', { search })
        .orWhere('course.shortDescription ILIKE :search', { search })
        .orWhere('course.slug ILIKE :search', { search })));
    }
    if (query.categoryId) builder.andWhere('category.id = :categoryId', { categoryId: query.categoryId });
    if (query.status === 'published') builder.andWhere('course.isPublished = true');
    if (query.status === 'draft') builder.andWhere('course.isPublished = false');
    if (query.level) builder.andWhere('course.level = :level', { level: query.level });
    if (query.mode) builder.andWhere('course.mode = :mode', { mode: query.mode });
    const [courses, totalItems] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const items = await this.attachCourseMetrics(courses);
    const [total, published, featured] = await Promise.all([
      this.coursesRepository.count(),
      this.coursesRepository.count({ where: { isPublished: true } }),
      this.coursesRepository.count({ where: { isFeatured: true } }),
    ]);
    return {
      summary: { total, published, drafts: total - published, featured },
      courses: items,
      pagination: { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) },
    };
  }

  async getAdminFilterOptions() {
    const categories = await this.dataSource.getRepository(CourseCategory).find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return { categories: categories.map(({ id, name, slug }) => ({ id, name, slug })) };
  }

  async findAdminCourse(id: string) {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: { category: true, modules: true, lessons: true },
      order: { modules: { sortOrder: 'ASC' }, lessons: { sortOrder: 'ASC' } },
    });
    if (!course) throw new NotFoundException('Course not found');
    const [mapped] = await this.attachCourseMetrics([course]);
    return mapped;
  }

  async createAdminCourse(dto: CreateAdminCourseDto, actorId: string) {
    const slug = this.normalizeSlug(dto.slug);
    await this.ensureSlugAvailable(slug);
    const category = await this.resolveCategory(dto.categoryId);
    const course = await this.dataSource.transaction(async (manager) => {
      const created = await manager.save(manager.create(Course, {
        slug,
        title: dto.title.trim(),
        shortDescription: dto.shortDescription.trim(),
        description: dto.description?.trim() || undefined,
        thumbnail: dto.thumbnail?.trim() || undefined,
        category,
        level: dto.level,
        duration: dto.duration,
        durationUnit: dto.durationUnit,
        mode: dto.mode,
        language: dto.language,
        fee: dto.fee,
        discountFee: dto.discountFee,
        isFeatured: dto.isFeatured,
        isPublished: dto.isPublished,
      }));
      if (dto.modules?.length) {
        await manager.save(CourseModule, dto.modules.map((module) => manager.create(CourseModule, {
          course: created,
          title: module.title.trim(),
          description: module.description?.trim() || undefined,
          sortOrder: module.sortOrder,
        })));
      }
      return created;
    });
    await this.logAction(actorId, 'create', course.id, { slug, isPublished: course.isPublished });
    return this.findAdminCourse(course.id);
  }

  async updateAdminCourse(id: string, dto: UpdateAdminCourseDto, actorId: string) {
    const course = await this.coursesRepository.findOne({ where: { id }, relations: { category: true } });
    if (!course) throw new NotFoundException('Course not found');
    if (dto.slug) {
      const slug = this.normalizeSlug(dto.slug);
      await this.ensureSlugAvailable(slug, id);
      course.slug = slug;
    }
    if (dto.categoryId !== undefined) course.category = await this.resolveCategory(dto.categoryId);
    const fields: Array<keyof UpdateAdminCourseDto> = [
      'title', 'shortDescription', 'description', 'thumbnail', 'level', 'duration',
      'durationUnit', 'mode', 'language', 'fee', 'discountFee', 'isFeatured', 'isPublished',
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) (course as unknown as Record<string, unknown>)[field] = dto[field];
    }
    await this.coursesRepository.save(course);
    if (dto.modules) await this.syncModules(course, dto.modules);
    await this.logAction(actorId, 'update', id, { fields: Object.keys(dto) });
    return this.findAdminCourse(id);
  }

  async setPublished(id: string, isPublished: boolean, actorId: string) {
    const course = await this.coursesRepository.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    course.isPublished = isPublished;
    await this.coursesRepository.save(course);
    await this.logAction(actorId, isPublished ? 'publish' : 'unpublish', id);
    return { message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`, isPublished };
  }

  async deleteAdminCourse(id: string, actorId: string) {
    const course = await this.coursesRepository.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    const enrollmentCount = await this.dataSource.getRepository(Enrollment).count({ where: { course: { id } } });
    if (enrollmentCount) throw new ConflictException('Courses with enrollments cannot be deleted. Unpublish this course instead.');
    const [batchCount, moduleCount, lessonCount] = await Promise.all([
      this.dataSource.getRepository(Batch).count({ where: { course: { id } } }),
      this.dataSource.getRepository(CourseModule).count({ where: { course: { id } } }),
      this.dataSource.getRepository(Lesson).count({ where: { course: { id } } }),
    ]);
    if (batchCount || moduleCount || lessonCount) {
      throw new ConflictException('Remove linked batches, modules, and lessons before deleting this course.');
    }
    await this.coursesRepository.remove(course);
    await this.logAction(actorId, 'delete', id, { title: course.title });
    return { message: 'Course deleted successfully' };
  }

  private async attachCourseMetrics(courses: Course[]) {
    if (!courses.length) return [];
    const ids = courses.map(({ id }) => id);
    const [enrollments, batches, modules, lessons] = await Promise.all([
      this.dataSource.getRepository(Enrollment).find({ where: { course: { id: In(ids) } }, relations: { course: true } }),
      this.dataSource.getRepository(Batch).find({ where: { course: { id: In(ids) } }, relations: { course: true } }),
      this.dataSource.getRepository(CourseModule).find({ where: { course: { id: In(ids) } }, relations: { course: true } }),
      this.dataSource.getRepository(Lesson).find({ where: { course: { id: In(ids) } }, relations: { course: true } }),
    ]);
    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription,
      description: course.description ?? '',
      thumbnail: course.thumbnail ?? '',
      category: course.category ? { id: course.category.id, name: course.category.name, slug: course.category.slug } : null,
      level: course.level,
      duration: course.duration,
      durationUnit: course.durationUnit,
      mode: course.mode,
      language: course.language,
      fee: Number(course.fee),
      discountFee: course.discountFee === undefined || course.discountFee === null ? null : Number(course.discountFee),
      isFeatured: course.isFeatured,
      isPublished: course.isPublished,
      enrollmentsCount: enrollments.filter((item) => item.course.id === course.id).length,
      batchesCount: batches.filter((item) => item.course.id === course.id).length,
      modulesCount: modules.filter((item) => item.course.id === course.id).length,
      lessonsCount: lessons.filter((item) => item.course.id === course.id).length,
      modules: modules
        .filter((item) => item.course.id === course.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description ?? '',
          sortOrder: item.sortOrder,
        })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));
  }

  private normalizeSlug(value: string) {
    const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) throw new BadRequestException('A valid course slug is required');
    return slug;
  }

  private async ensureSlugAvailable(slug: string, excludedId?: string) {
    const existing = await this.coursesRepository.findOne({ where: { slug } });
    if (existing && existing.id !== excludedId) throw new ConflictException('A course with this slug already exists');
  }

  private async resolveCategory(categoryId?: string) {
    if (!categoryId) return undefined;
    const category = await this.dataSource.getRepository(CourseCategory).findOne({ where: { id: categoryId, isActive: true } });
    if (!category) throw new BadRequestException('Course category not found');
    return category;
  }

  private async syncModules(course: Course, requested: NonNullable<UpdateAdminCourseDto['modules']>) {
    const repository = this.dataSource.getRepository(CourseModule);
    const existing = await repository.find({ where: { course: { id: course.id } }, relations: { course: true } });
    const existingById = new Map(existing.map((item) => [item.id, item]));
    const requestedIds = new Set(requested.flatMap((item) => item.id ? [item.id] : []));
    for (const module of requested) {
      if (module.id) {
        const current = existingById.get(module.id);
        if (!current) throw new BadRequestException('Course module does not belong to this course');
        current.title = module.title.trim();
        current.description = module.description?.trim() || undefined;
        current.sortOrder = module.sortOrder;
        await repository.save(current);
      } else {
        await repository.save(repository.create({
          course,
          title: module.title.trim(),
          description: module.description?.trim() || undefined,
          sortOrder: module.sortOrder,
        }));
      }
    }
    const removed = existing.filter((item) => !requestedIds.has(item.id));
    if (removed.length) {
      const lessonCount = await this.dataSource.getRepository(Lesson).count({ where: { module: { id: In(removed.map((item) => item.id)) } } });
      if (lessonCount) throw new ConflictException('Modules with lessons cannot be removed. Move or delete their lessons first.');
      await repository.remove(removed);
    }
  }

  private async logAction(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) {
    await this.dataSource.getRepository(AuditLog).save({
      user: { id: actorId } as User,
      action,
      module: 'courses',
      recordId,
      metadata,
    });
  }
}
