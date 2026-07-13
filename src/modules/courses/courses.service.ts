import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, ILike, In, Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { enrichOutlineFromCopy } from '../../database/seeds/course-outline-copy';
import {
  AuditLog,
  Batch,
  Course,
  CourseCategory,
  CourseFAQ,
  CourseModule,
  CourseOutlineModule,
  CourseOutcome,
  CourseProject,
  CourseQuarter,
  CourseTool,
  CourseTopic,
  Enrollment,
  Lesson,
  Offer,
  User,
} from '../../database/entities';
import { AdminCoursesQueryDto } from './dto/admin-courses-query.dto';
import { CreateAdminCourseDto, AdminCourseQuarterDto } from './dto/create-admin-course.dto';
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
      relations: { category: true, tools: true },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: items.map((course) => this.mapPublicCourseListItem(course)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findPublicCourseBySlug(slug: string) {
    const course = await this.coursesRepository.findOne({
      where: { slug, isPublished: true },
      relations: { category: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const [
      offers,
      relatedCourses,
      quarters,
      outlineModules,
      topics,
      tools,
      projects,
      outcomes,
      faqs,
    ] = await Promise.all([
      this.dataSource.getRepository(Offer).find({ where: { isActive: true } }),
      this.coursesRepository.find({
        where: course.category?.id
          ? { isPublished: true, category: { id: course.category.id } }
          : { isPublished: true },
        relations: { category: true },
        order: { displayOrder: 'ASC', createdAt: 'ASC' },
        take: 8,
      }),
      this.dataSource.getRepository(CourseQuarter).find({
        where: { course: { id: course.id } },
        order: { sortOrder: 'ASC' },
      }),
      this.dataSource.getRepository(CourseOutlineModule).find({
        where: { course: { id: course.id } },
        relations: { quarter: true },
        order: { sortOrder: 'ASC' },
      }),
      this.dataSource.getRepository(CourseTopic).find({
        where: { course: { id: course.id } },
        relations: { module: true },
        order: { sortOrder: 'ASC' },
      }),
      this.dataSource.getRepository(CourseTool).find({
        where: { course: { id: course.id } },
        order: { sortOrder: 'ASC' },
      }),
      this.dataSource.getRepository(CourseProject).find({
        where: { course: { id: course.id } },
        order: { sortOrder: 'ASC' },
      }),
      this.dataSource.getRepository(CourseOutcome).find({
        where: { course: { id: course.id } },
        order: { sortOrder: 'ASC' },
      }),
      this.dataSource.getRepository(CourseFAQ).find({
        where: { course: { id: course.id } },
        order: { sortOrder: 'ASC' },
      }),
    ]);

    const topicsByModuleId = new Map<string, CourseTopic[]>();
    for (const topic of topics) {
      const moduleId = topic.module.id;
      topicsByModuleId.set(moduleId, [...(topicsByModuleId.get(moduleId) ?? []), topic]);
    }

    const modulesByQuarterId = new Map<string, CourseOutlineModule[]>();
    for (const module of outlineModules) {
      module.topics = topicsByModuleId.get(module.id) ?? [];
      const quarterId = module.quarter.id;
      modulesByQuarterId.set(quarterId, [...(modulesByQuarterId.get(quarterId) ?? []), module]);
    }

    course.quarters = quarters.map((quarter) => ({
      ...quarter,
      modules: modulesByQuarterId.get(quarter.id) ?? [],
      topics: [],
    }));
    course.tools = tools;
    course.projects = projects;
    course.outcomes = outcomes;
    course.faqs = faqs;

    return this.mapPublicCourseDetail(course, offers, relatedCourses.filter((item) => item.id !== course.id).slice(0, 3));
  }

  async findAdminCourses(query: AdminCoursesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.category', 'category')
      .orderBy('course.displayOrder', 'ASC')
      .addOrderBy('course.createdAt', 'DESC');
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
    const [categories, totalCourses] = await Promise.all([
      this.dataSource.getRepository(CourseCategory).find({
        where: { isActive: true },
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
      this.coursesRepository.count(),
    ]);
    return {
      categories: categories.map(({ id, name, slug }) => ({ id, name, slug })),
      nextDisplayOrder: totalCourses + 1,
      totalCourses,
    };
  }

  async findAdminCourse(id: string) {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: { category: true, modules: true, lessons: true },
      order: { modules: { sortOrder: 'ASC' }, lessons: { sortOrder: 'ASC' } },
    });
    if (!course) throw new NotFoundException('Course not found');
    const [mapped] = await this.attachCourseMetrics([course]);
    const outline = enrichOutlineFromCopy(mapped.slug, await this.loadAdminOutline(id));
    return { ...mapped, outline, hasOutline: outline.length > 0 };
  }

  async createAdminCourse(dto: CreateAdminCourseDto, actorId: string) {
    const slug = await this.createUniqueSlug(dto.slug || dto.title);
    const category = await this.resolveCategory(dto.categoryId);
    const course = await this.dataSource.transaction(async (manager) => {
      const created = await manager.save(manager.create(Course, {
        slug,
        title: dto.title.trim(),
        shortDescription: dto.shortDescription.trim(),
        description: dto.description?.trim() || undefined,
        thumbnail: dto.thumbnail?.trim() || undefined,
        techStack: this.cleanTechStack(dto.techStack),
        category,
        level: dto.level,
        duration: dto.duration,
        durationUnit: dto.durationUnit,
        durationMonths: this.durationMonthsFromValues(dto.duration, dto.durationUnit),
        durationLabel: `${this.durationMonthsFromValues(dto.duration, dto.durationUnit)} Months`,
        monthlyFee: 5000,
        mode: dto.mode,
        language: dto.language,
        fee: dto.fee,
        discountFee: dto.discountFee,
        isFeatured: dto.isFeatured,
        isPublished: dto.isPublished,
        displayOrder: 0,
      }));
      if (dto.outline !== undefined) {
        await this.syncOutline(manager, created, dto.outline);
      } else if (dto.modules?.length) {
        await manager.save(CourseModule, dto.modules.map((module) => manager.create(CourseModule, {
          course: created,
          title: module.title.trim(),
          description: module.description?.trim() || undefined,
          sortOrder: module.sortOrder,
        })));
      }
      return created;
    });
    await this.applyDisplayOrder(course.id, dto.displayOrder);
    await this.logAction(actorId, 'create', course.id, { slug, isPublished: course.isPublished });
    return this.findAdminCourse(course.id);
  }

  async updateAdminCourse(id: string, dto: UpdateAdminCourseDto, actorId: string) {
    const course = await this.coursesRepository.findOne({ where: { id }, relations: { category: true } });
    if (!course) throw new NotFoundException('Course not found');
    if (dto.slug) {
      const slug = this.normalizeSlug(dto.slug);
      course.slug = await this.createUniqueSlug(slug, id);
    }
    if (dto.categoryId !== undefined) course.category = await this.resolveCategory(dto.categoryId);
    const pendingDisplayOrder = dto.displayOrder;
    const fields: Array<keyof UpdateAdminCourseDto> = [
      'title', 'shortDescription', 'description', 'thumbnail', 'level', 'duration',
      'durationUnit', 'mode', 'language', 'fee', 'discountFee', 'isFeatured', 'isPublished',
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) (course as unknown as Record<string, unknown>)[field] = dto[field];
    }
    if (dto.duration !== undefined || dto.durationUnit !== undefined) {
      course.durationMonths = this.durationMonths(course);
      course.durationLabel = `${course.durationMonths} Months`;
    }
    if (dto.techStack !== undefined) course.techStack = this.cleanTechStack(dto.techStack);
    await this.coursesRepository.save(course);
    if (pendingDisplayOrder !== undefined) {
      await this.applyDisplayOrder(id, pendingDisplayOrder);
    }
    if (dto.outline !== undefined) {
      await this.dataSource.transaction((manager) => this.syncOutline(manager, course, dto.outline!));
    } else if (dto.modules !== undefined) {
      await this.syncModules(course, dto.modules);
    }
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
    await this.normalizeAllDisplayOrders();
    await this.logAction(actorId, 'delete', id, { title: course.title });
    return { message: 'Course deleted successfully' };
  }

  private async applyDisplayOrder(courseId: string, targetOrder?: number) {
    const courses = await this.coursesRepository.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    if (!courses.length) return;

    const current = courses.find((course) => course.id === courseId);
    if (!current) return;

    const others = courses.filter((course) => course.id !== courseId);
    const maxPosition = others.length + 1;
    const position = Math.min(
      Math.max(1, Math.floor(targetOrder ?? maxPosition)),
      maxPosition,
    );

    others.splice(position - 1, 0, current);
    await this.normalizeCourseList(others);
  }

  private async normalizeAllDisplayOrders() {
    const courses = await this.coursesRepository.find({
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    await this.normalizeCourseList(courses);
  }

  private async normalizeCourseList(courses: Course[]) {
    await Promise.all(
      courses.map((course, index) => {
        const nextOrder = index + 1;
        return course.displayOrder === nextOrder
          ? Promise.resolve()
          : this.coursesRepository.update(course.id, { displayOrder: nextOrder });
      }),
    );
  }

  private async attachCourseMetrics(courses: Course[]) {
    if (!courses.length) return [];
    const ids = courses.map(({ id }) => id);
    const [enrollments, batches, modules, outlineModules, lessons] = await Promise.all([
      this.dataSource.getRepository(Enrollment).find({ where: { course: { id: In(ids) } }, relations: { course: true } }),
      this.dataSource.getRepository(Batch).find({ where: { course: { id: In(ids) } }, relations: { course: true } }),
      this.dataSource.getRepository(CourseModule).find({ where: { course: { id: In(ids) } }, relations: { course: true } }),
      this.dataSource.getRepository(CourseOutlineModule).find({ where: { course: { id: In(ids) } }, relations: { course: true }, order: { sortOrder: 'ASC' } }),
      this.dataSource.getRepository(Lesson).find({ where: { course: { id: In(ids) } }, relations: { course: true } }),
    ]);
    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription,
      description: course.description ?? '',
      thumbnail: course.thumbnail ?? '',
      techStack: course.techStack ?? [],
      category: course.category ? { id: course.category.id, name: course.category.name, slug: course.category.slug } : null,
      level: course.level,
      duration: course.duration,
      durationMonths: course.durationMonths ?? this.durationMonths(course),
      durationLabel: course.durationLabel ?? `${course.durationMonths ?? this.durationMonths(course)} Months`,
      durationUnit: course.durationUnit,
      mode: course.mode,
      language: course.language,
      monthlyFee: Number(course.monthlyFee ?? 5000),
      fee: Number(course.fee),
      discountFee: course.discountFee === undefined || course.discountFee === null ? null : Number(course.discountFee),
      isFeatured: course.isFeatured,
      isPublished: course.isPublished,
      displayOrder: course.displayOrder ?? 0,
      enrollmentsCount: enrollments.filter((item) => item.course.id === course.id).length,
      batchesCount: batches.filter((item) => item.course.id === course.id).length,
      modulesCount: Math.max(
        modules.filter((item) => item.course.id === course.id).length,
        outlineModules.filter((item) => item.course.id === course.id).length,
      ),
      lessonsCount: lessons.filter((item) => item.course.id === course.id).length,
      modules: this.adminCourseModules(course.id, modules, outlineModules)
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

  private adminCourseModules(courseId: string, modules: CourseModule[], outlineModules: CourseOutlineModule[]): Array<{ id?: string; title: string; description?: string; sortOrder: number }> {
    const legacy = modules.filter((item) => item.course.id === courseId);
    if (legacy.length) return legacy;
    return outlineModules
      .filter((item) => item.course.id === courseId)
      .map((item) => ({
        id: undefined,
        title: item.title,
        description: item.description,
        sortOrder: item.sortOrder,
      }));
  }

  private normalizeSlug(value: string) {
    const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) throw new BadRequestException('A valid course slug is required');
    return slug;
  }

  private async createUniqueSlug(value: string, excludedId?: string) {
    const base = this.normalizeSlug(value);
    let candidate = base;
    let suffix = 2;
    while (await this.slugExists(candidate, excludedId)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private async slugExists(slug: string, excludedId?: string) {
    const existing = await this.coursesRepository.findOne({ where: { slug } });
    return Boolean(existing && existing.id !== excludedId);
  }

  private cleanTechStack(techStack?: string[]) {
    if (!techStack) return undefined;
    const values = techStack
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);
    return values.length ? Array.from(new Set(values)) : undefined;
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

  private async loadAdminOutline(courseId: string) {
    const [quarters, outlineModules, topics] = await Promise.all([
      this.dataSource.getRepository(CourseQuarter).find({
        where: { course: { id: courseId } },
        order: { sortOrder: 'ASC' },
      }),
      this.dataSource.getRepository(CourseOutlineModule).find({
        where: { course: { id: courseId } },
        relations: { quarter: true },
        order: { sortOrder: 'ASC' },
      }),
      this.dataSource.getRepository(CourseTopic).find({
        where: { course: { id: courseId } },
        relations: { module: true, quarter: true },
        order: { sortOrder: 'ASC' },
      }),
    ]);
    if (!quarters.length) return [];
    const topicsByModuleId = new Map<string, CourseTopic[]>();
    for (const topic of topics) {
      const moduleId = topic.module.id;
      topicsByModuleId.set(moduleId, [...(topicsByModuleId.get(moduleId) ?? []), topic]);
    }
    const modulesByQuarterId = new Map<string, CourseOutlineModule[]>();
    for (const module of outlineModules) {
      const quarterId = module.quarter.id;
      modulesByQuarterId.set(quarterId, [...(modulesByQuarterId.get(quarterId) ?? []), module]);
    }
    return quarters.map((quarter) => ({
      id: quarter.id,
      title: quarter.title,
      subtitle: quarter.subtitle ?? '',
      description: quarter.description ?? '',
      modules: (modulesByQuarterId.get(quarter.id) ?? []).map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? '',
        topics: (topicsByModuleId.get(module.id) ?? []).map((topic) => ({
          id: topic.id,
          title: topic.title,
          description: topic.description ?? '',
          level: topic.level ?? 'foundation',
        })),
      })),
    }));
  }

  private async syncOutline(
    manager: DataSource['manager'],
    course: Course,
    outline: AdminCourseQuarterDto[],
  ) {
    const courseId = course.id;
    await manager
      .createQueryBuilder()
      .delete()
      .from(CourseTopic)
      .where('course_id = :courseId', { courseId })
      .execute();
    await manager
      .createQueryBuilder()
      .delete()
      .from(CourseOutlineModule)
      .where('course_id = :courseId', { courseId })
      .execute();
    await manager
      .createQueryBuilder()
      .delete()
      .from(CourseQuarter)
      .where('course_id = :courseId', { courseId })
      .execute();

    for (const [quarterIndex, quarterDto] of outline.entries()) {
      if (!quarterDto.title?.trim()) continue;
      const quarter = await manager.save(
        CourseQuarter,
        manager.create(CourseQuarter, {
          course,
          quarterNumber: quarterIndex + 1,
          title: quarterDto.title.trim(),
          subtitle: quarterDto.subtitle?.trim() || undefined,
          description: quarterDto.description?.trim() || undefined,
          durationMonths: 3,
          sortOrder: quarterIndex + 1,
        }),
      );

      for (const [moduleIndex, moduleDto] of (quarterDto.modules ?? []).entries()) {
        if (!moduleDto.title?.trim()) continue;
        const outlineModule = await manager.save(
          CourseOutlineModule,
          manager.create(CourseOutlineModule, {
            course,
            quarter,
            title: moduleDto.title.trim(),
            description: moduleDto.description?.trim() || undefined,
            sortOrder: moduleIndex + 1,
          }),
        );

        for (const [topicIndex, topicDto] of (moduleDto.topics ?? []).entries()) {
          if (!topicDto.title?.trim()) continue;
          await manager.save(
            CourseTopic,
            manager.create(CourseTopic, {
              course,
              quarter,
              module: outlineModule,
              title: topicDto.title.trim(),
              description: topicDto.description?.trim() || undefined,
              level: topicDto.level?.trim() || 'foundation',
              sortOrder: topicIndex + 1,
            }),
          );
        }
      }
    }
  }

  private durationMonthsFromValues(duration: number, durationUnit: 'weeks' | 'months') {
    return durationUnit === 'months' ? Math.max(1, duration) : Math.max(1, Math.ceil(duration / 4));
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

  private mapPublicCourseListItem(course: Course) {
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription,
      description: course.description ?? '',
      thumbnail: course.thumbnail ?? '',
      techStack: this.publicToolNames(course),
      category: course.category ? { id: course.category.id, name: course.category.name, slug: course.category.slug } : null,
      level: course.level,
      duration: course.duration,
      durationMonths: course.durationMonths ?? this.durationMonths(course),
      durationLabel: course.durationLabel ?? `${course.durationMonths ?? this.durationMonths(course)} Months`,
      durationUnit: course.durationUnit,
      mode: course.mode,
      language: course.language,
      monthlyFee: Number(course.monthlyFee ?? 5000),
      fee: Number(course.fee),
      discountFee: course.discountFee === undefined || course.discountFee === null ? null : Number(course.discountFee),
      isFeatured: course.isFeatured,
      isPublished: course.isPublished,
      displayOrder: course.displayOrder ?? 0,
    };
  }

  private mapPublicCourseDetail(course: Course, offers: Offer[], relatedCourses: Course[]) {
    const durationMonths = course.durationMonths ?? this.durationMonths(course);
    const monthlyFee = Number(course.monthlyFee ?? 5000);
    const quarterlyGross = monthlyFee * 3;
    const quarterlyDiscountPercentage = this.offerPercentage(offers, 'quarterly-discount', 20);
    const fullCourseGross = durationMonths * monthlyFee;
    const fullCourseDiscountPercentage = this.offerPercentage(offers, 'full-course-discount', 35);
    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription,
        description: course.description ?? '',
        thumbnail: course.thumbnail ?? '',
        category: course.category ? { id: course.category.id, name: course.category.name, slug: course.category.slug } : null,
        level: course.level,
        durationMonths,
        durationLabel: course.durationLabel ?? `${durationMonths} Months`,
        duration: course.duration,
        durationUnit: course.durationUnit,
        mode: course.mode,
        language: course.language,
        monthlyFee,
        fee: Number(course.fee),
        discountFee: course.discountFee === undefined || course.discountFee === null ? null : Number(course.discountFee),
        isFeatured: course.isFeatured,
        isPublished: course.isPublished,
      },
      pricing: {
        monthlyFee,
        monthlyAmount: monthlyFee,
        quarterlyGross,
        quarterlyDiscountPercentage,
        quarterlyFinal: Math.max(0, quarterlyGross - Math.round(quarterlyGross * quarterlyDiscountPercentage / 100)),
        fullCourseGross,
        fullCourseDiscountPercentage,
        fullCourseFinal: Math.max(0, fullCourseGross - Math.round(fullCourseGross * fullCourseDiscountPercentage / 100)),
        quarterlyAvailable: durationMonths >= 6,
        referralNewStudentDiscount: this.offerAmount(offers, 'referral-new-student-discount', 500),
        referrerReward: 1000,
        scholarshipDiscountPercentage: this.offerPercentage(offers, 'scholarship-discount', 50),
        scholarshipRequiredScore: 80,
      },
      quarters: enrichOutlineFromCopy(
        course.slug,
        (course.quarters ?? [])
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((quarter) => ({
            id: quarter.id,
            quarterNumber: quarter.quarterNumber,
            title: quarter.title,
            subtitle: quarter.subtitle ?? '',
            description: quarter.description ?? '',
            durationMonths: quarter.durationMonths,
            modules: (quarter.modules ?? [])
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((module) => ({
                id: module.id,
                title: module.title,
                description: module.description ?? '',
                topics: (module.topics ?? [])
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((topic) => ({
                    id: topic.id,
                    title: topic.title,
                    description: topic.description ?? '',
                    level: topic.level,
                  })),
              })),
          })),
      ),
      tools: (course.tools ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((tool) => ({
        id: tool.id,
        name: tool.name,
        type: tool.type ?? '',
        icon: tool.icon ?? '',
      })),
      projects: (course.projects ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description ?? '',
        quarterNumber: project.quarterNumber ?? null,
        skills: project.skills ?? [],
      })),
      outcomes: (course.outcomes ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((outcome) => ({
        id: outcome.id,
        title: outcome.title,
        description: outcome.description ?? '',
      })),
      faqs: (course.faqs ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
      })),
      relatedCourses: relatedCourses.map((item) => this.mapPublicCourseListItem(item)),
    };
  }

  private publicToolNames(course: Course) {
    const tools = (course.tools ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder).map((tool) => tool.name);
    return tools.length ? tools : course.techStack ?? [];
  }

  private durationMonths(course: Course) {
    return course.durationUnit === 'months' ? Math.max(1, course.duration) : Math.max(1, Math.ceil(course.duration / 4));
  }

  private offerPercentage(offers: Offer[], slug: string, fallback: number) {
    return Number(offers.find((offer) => offer.slug === slug)?.discountPercentage ?? fallback);
  }

  private offerAmount(offers: Offer[], slug: string, fallback: number) {
    return Number(offers.find((offer) => offer.slug === slug)?.discountAmount ?? fallback);
  }
}
