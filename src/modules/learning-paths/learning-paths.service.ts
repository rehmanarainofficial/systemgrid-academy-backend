import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, ILike, Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  AuditLog,
  Course,
  LearningPath,
  LearningPathCourse,
  LearningPathOutcome,
  LearningPathPhase,
  User,
} from '../../database/entities';
import { AdminLearningPathsQueryDto } from './dto/admin-learning-paths-query.dto';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateLearningPathDto } from './dto/update-learning-path.dto';

@Injectable()
export class LearningPathsService {
  constructor(
    @InjectRepository(LearningPath)
    private readonly learningPathsRepository: Repository<LearningPath>,
    private readonly dataSource: DataSource,
  ) {}

  async findPublicPaths(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.learningPathsRepository.findAndCount({
      where: { isPublished: true },
      relations: {
        primaryCourse: true,
        pathCourses: { course: true },
      },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((path) => this.mapPublicListItem(path)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findPublicPathBySlug(slug: string) {
    const path = await this.learningPathsRepository.findOne({
      where: { slug, isPublished: true },
      relations: {
        primaryCourse: true,
        phases: true,
        outcomes: true,
        pathCourses: { course: true },
      },
      order: {
        phases: { sortOrder: 'ASC' },
        outcomes: { sortOrder: 'ASC' },
        pathCourses: { sortOrder: 'ASC' },
      },
    });
    if (!path) throw new NotFoundException('Learning path not found');
    return this.mapPublicDetail(path);
  }

  async findAdminPaths(query: AdminLearningPathsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.learningPathsRepository
      .createQueryBuilder('path')
      .leftJoinAndSelect('path.primaryCourse', 'primaryCourse')
      .orderBy('path.sortOrder', 'ASC')
      .addOrderBy('path.createdAt', 'ASC');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(
        new Brackets((qb) => {
          qb.where('path.title ILIKE :search', { search })
            .orWhere('path.slug ILIKE :search', { search })
            .orWhere('path.summary ILIKE :search', { search });
        }),
      );
    }
    if (query.status === 'published') builder.andWhere('path.isPublished = true');
    if (query.status === 'draft') builder.andWhere('path.isPublished = false');

    const [items, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const [totalPaths, published, featured] = await Promise.all([
      this.learningPathsRepository.count(),
      this.learningPathsRepository.count({ where: { isPublished: true } }),
      this.learningPathsRepository.count({ where: { isFeatured: true } }),
    ]);

    return {
      summary: {
        total: totalPaths,
        published,
        drafts: totalPaths - published,
        featured,
      },
      items: items.map((path) => this.mapAdminListItem(path)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getAdminFilterOptions() {
    const courses = await this.dataSource.getRepository(Course).find({
      where: { isPublished: true },
      order: { title: 'ASC' },
      select: ['id', 'title', 'slug', 'shortDescription', 'description', 'durationMonths', 'duration', 'durationLabel', 'level', 'techStack'],
    });
    const paths = await this.learningPathsRepository.find({
      order: { sortOrder: 'ASC' },
      select: ['slug', 'title'],
    });
    return {
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription,
        durationLabel: course.durationLabel ?? `${course.durationMonths ?? course.duration} Months`,
        level: course.level,
        techStack: course.techStack ?? [],
      })),
      pathSlugs: paths.map((path) => ({ slug: path.slug, title: path.title })),
    };
  }

  async findAdminPath(id: string) {
    const path = await this.learningPathsRepository.findOne({
      where: { id },
      relations: {
        primaryCourse: true,
        phases: true,
        outcomes: true,
        pathCourses: { course: true },
      },
      order: {
        phases: { sortOrder: 'ASC' },
        outcomes: { sortOrder: 'ASC' },
        pathCourses: { sortOrder: 'ASC' },
      },
    });
    if (!path) throw new NotFoundException('Learning path not found');
    return this.mapAdminDetail(path);
  }

  async createAdminPath(dto: CreateLearningPathDto, userId: string) {
    await this.ensureSlugAvailable(dto.slug);
    const path = await this.dataSource.transaction(async (manager) => {
      const primaryCourse = await this.resolvePrimaryCourse(manager.getRepository(Course), dto.primaryCourseId);
      const savedPath = await manager.save(
        LearningPath,
        manager.create(LearningPath, {
          slug: dto.slug,
          title: dto.title,
          badge: dto.badge,
          level: dto.level,
          duration: dto.duration,
          bestFor: dto.bestFor,
          summary: dto.summary,
          description: dto.description,
          guidance: dto.guidance,
          iconKey: dto.iconKey ?? 'route',
          tools: dto.tools ?? [],
          relatedSlugs: dto.relatedSlugs ?? [],
          primaryCourse: primaryCourse ?? undefined,
          isPublished: dto.isPublished ?? true,
          isFeatured: dto.isFeatured ?? false,
          sortOrder: dto.sortOrder ?? 0,
        }),
      );
      await this.replaceChildren(manager, savedPath, dto);
      return savedPath;
    });

    await this.logAction(userId, 'create_learning_path', path.id, { slug: path.slug });
    return this.findAdminPath(path.id);
  }

  async updateAdminPath(id: string, dto: UpdateLearningPathDto, userId: string) {
    const existing = await this.learningPathsRepository.findOne({
      where: { id },
      relations: { primaryCourse: true },
    });
    if (!existing) throw new NotFoundException('Learning path not found');
    if (dto.slug && dto.slug !== existing.slug) {
      await this.ensureSlugAvailable(dto.slug, id);
    }

    await this.dataSource.transaction(async (manager) => {
      let primaryCourse: Course | null | undefined = existing.primaryCourse;
      if (dto.primaryCourseId !== undefined) {
        primaryCourse = dto.primaryCourseId
          ? await this.resolvePrimaryCourse(manager.getRepository(Course), dto.primaryCourseId)
          : null;
      }

      await manager.save(
        LearningPath,
        manager.merge(LearningPath, existing, {
          slug: dto.slug ?? existing.slug,
          title: dto.title ?? existing.title,
          badge: dto.badge === undefined ? existing.badge : dto.badge,
          level: dto.level ?? existing.level,
          duration: dto.duration ?? existing.duration,
          bestFor: dto.bestFor ?? existing.bestFor,
          summary: dto.summary ?? existing.summary,
          description: dto.description ?? existing.description,
          guidance: dto.guidance ?? existing.guidance,
          iconKey: dto.iconKey ?? existing.iconKey,
          tools: dto.tools ?? existing.tools,
          relatedSlugs: dto.relatedSlugs ?? existing.relatedSlugs,
          primaryCourse: primaryCourse ?? undefined,
          isPublished: dto.isPublished ?? existing.isPublished,
          isFeatured: dto.isFeatured ?? existing.isFeatured,
          sortOrder: dto.sortOrder ?? existing.sortOrder,
        }),
      );

      if (dto.phases || dto.outcomes || dto.courseIds) {
        await this.replaceChildren(manager, existing, dto);
      }
    });

    await this.logAction(userId, 'update_learning_path', id, { slug: dto.slug ?? existing.slug });
    return this.findAdminPath(id);
  }

  async setPublished(id: string, isPublished: boolean, userId: string) {
    const path = await this.learningPathsRepository.findOne({ where: { id } });
    if (!path) throw new NotFoundException('Learning path not found');
    path.isPublished = isPublished;
    await this.learningPathsRepository.save(path);
    await this.logAction(userId, isPublished ? 'publish_learning_path' : 'unpublish_learning_path', id);
    return {
      message: `Learning path ${isPublished ? 'published' : 'unpublished'} successfully`,
      isPublished,
      path: await this.findAdminPath(id),
    };
  }

  async deleteAdminPath(id: string, userId: string) {
    const path = await this.learningPathsRepository.findOne({ where: { id } });
    if (!path) throw new NotFoundException('Learning path not found');
    await this.learningPathsRepository.remove(path);
    await this.logAction(userId, 'delete_learning_path', id, { slug: path.slug });
    return { success: true };
  }

  private async ensureSlugAvailable(slug: string, excludeId?: string) {
    const existing = await this.learningPathsRepository.findOne({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('Learning path slug already exists');
    }
  }

  private async resolvePrimaryCourse(coursesRepository: Repository<Course>, courseId?: string) {
    if (!courseId) return null;
    const course = await coursesRepository.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Primary course not found');
    return course;
  }

  private async replaceChildren(
    manager: DataSource['manager'],
    path: LearningPath,
    dto: Pick<CreateLearningPathDto, 'phases' | 'outcomes' | 'courseIds'>,
  ) {
    if (dto.phases) {
      await manager.delete(LearningPathPhase, { learningPath: { id: path.id } });
      await manager.save(
        LearningPathPhase,
        dto.phases.map((phase, index) =>
          manager.create(LearningPathPhase, {
            learningPath: path,
            title: phase.title,
            description: phase.description,
            topics: phase.topics,
            sortOrder: phase.sortOrder ?? index,
          }),
        ),
      );
    }

    if (dto.outcomes) {
      await manager.delete(LearningPathOutcome, { learningPath: { id: path.id } });
      await manager.save(
        LearningPathOutcome,
        dto.outcomes.map((outcome, index) =>
          manager.create(LearningPathOutcome, {
            learningPath: path,
            title: outcome.title,
            sortOrder: outcome.sortOrder ?? index,
          }),
        ),
      );
    }

    if (dto.courseIds) {
      await manager.delete(LearningPathCourse, { learningPath: { id: path.id } });
      const courses = await manager.find(Course, { where: dto.courseIds.map((id) => ({ id })) });
      if (courses.length !== dto.courseIds.length) {
        throw new NotFoundException('One or more related courses were not found');
      }
      await manager.save(
        LearningPathCourse,
        dto.courseIds.map((courseId, index) =>
          manager.create(LearningPathCourse, {
            learningPath: path,
            course: courses.find((course) => course.id === courseId),
            sortOrder: index,
          }),
        ),
      );
    }
  }

  private mapPublicListItem(path: LearningPath) {
    const primaryCourse = path.primaryCourse;
    const firstCourse = path.pathCourses?.[0]?.course;
    const courseSlug = primaryCourse?.slug ?? firstCourse?.slug;
    return {
      id: path.id,
      slug: path.slug,
      title: path.title,
      badge: path.badge ?? null,
      level: path.level,
      duration: path.duration,
      bestFor: path.bestFor,
      summary: path.summary,
      description: path.description,
      guidance: path.guidance,
      iconKey: path.iconKey,
      tools: path.tools,
      relatedSlugs: path.relatedSlugs,
      isFeatured: path.isFeatured,
      courseSlug: courseSlug ?? null,
      courseHref: courseSlug ? `/courses/${courseSlug}` : null,
    };
  }

  private mapPublicDetail(path: LearningPath) {
    const courses = (path.pathCourses ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.course.id,
        title: item.course.title,
        slug: item.course.slug,
        shortDescription: item.course.shortDescription,
      }));

    const primaryCourse = path.primaryCourse;
    const courseSlug = primaryCourse?.slug ?? courses[0]?.slug ?? null;

    return {
      ...this.mapPublicListItem(path),
      phases: (path.phases ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((phase) => ({
          title: phase.title,
          description: phase.description,
          topics: phase.topics,
        })),
      outcomes: (path.outcomes ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((outcome) => outcome.title),
      courses,
      courseSlug,
      courseHref: courseSlug ? `/courses/${courseSlug}` : null,
    };
  }

  private mapAdminListItem(path: LearningPath) {
    return {
      id: path.id,
      slug: path.slug,
      title: path.title,
      badge: path.badge ?? null,
      level: path.level,
      duration: path.duration,
      isPublished: path.isPublished,
      isFeatured: path.isFeatured,
      sortOrder: path.sortOrder,
      primaryCourse: path.primaryCourse
        ? { id: path.primaryCourse.id, title: path.primaryCourse.title, slug: path.primaryCourse.slug }
        : null,
      updatedAt: path.updatedAt,
    };
  }

  private mapAdminDetail(path: LearningPath) {
    return {
      ...this.mapAdminListItem(path),
      bestFor: path.bestFor,
      summary: path.summary,
      description: path.description,
      guidance: path.guidance,
      iconKey: path.iconKey,
      tools: path.tools,
      relatedSlugs: path.relatedSlugs,
      phases: (path.phases ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((phase) => ({
          id: phase.id,
          title: phase.title,
          description: phase.description,
          topics: phase.topics,
          sortOrder: phase.sortOrder,
        })),
      outcomes: (path.outcomes ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((outcome) => ({
          id: outcome.id,
          title: outcome.title,
          sortOrder: outcome.sortOrder,
        })),
      courseIds: (path.pathCourses ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => item.course.id),
      courses: (path.pathCourses ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          id: item.course.id,
          title: item.course.title,
          slug: item.course.slug,
        })),
    };
  }

  private async logAction(userId: string, action: string, recordId: string, metadata?: Record<string, unknown>) {
    await this.dataSource.getRepository(AuditLog).save(
      this.dataSource.getRepository(AuditLog).create({
        user: { id: userId } as User,
        action,
        module: 'learning-paths',
        recordId,
        metadata,
      }),
    );
  }
}
