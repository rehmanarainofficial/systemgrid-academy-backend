import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AuditLog, Batch, ClassRecording, Course, User } from '../../database/entities';
import { StudentNotificationsService } from '../notifications/student-notifications.service';
import { ClassRecordingsQueryDto } from './dto/class-recordings-query.dto';
import { CreateClassRecordingDto } from './dto/create-class-recording.dto';
import { UpdateClassRecordingDto } from './dto/update-class-recording.dto';

@Injectable()
export class ClassRecordingsService {
  constructor(
    @InjectRepository(ClassRecording)
    private readonly repository: Repository<ClassRecording>,
    private readonly dataSource: DataSource,
    private readonly studentNotifications: StudentNotificationsService,
  ) {}

  async findAll(query: ClassRecordingsQueryDto) {
    const builder = this.repository
      .createQueryBuilder('recording')
      .leftJoinAndSelect('recording.course', 'course')
      .leftJoinAndSelect('recording.batch', 'batch')
      .orderBy('recording.recordedDate', 'DESC')
      .addOrderBy('recording.createdAt', 'DESC');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(
        new Brackets((where) =>
          where
            .where('recording.title ILIKE :search', { search })
            .orWhere('recording.description ILIKE :search', { search })
            .orWhere('course.title ILIKE :search', { search })
            .orWhere('batch.title ILIKE :search', { search })
            .orWhere('batch.code ILIKE :search', { search }),
        ),
      );
    }

    if (query.courseId) {
      builder.andWhere('course.id = :courseId', { courseId: query.courseId });
    }
    if (query.batchId) {
      builder.andWhere('batch.id = :batchId', { batchId: query.batchId });
    }
    if (query.status === 'published') {
      builder.andWhere('recording.isPublished = true');
    }
    if (query.status === 'draft') {
      builder.andWhere('recording.isPublished = false');
    }

    const [recordings, totalItems] = await builder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const [total, published] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { isPublished: true } }),
    ]);

    return {
      summary: {
        total,
        published,
        draft: total - published,
      },
      recordings: recordings.map((rec) => this.map(rec)),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / query.limit)),
      },
    };
  }

  async filterOptions() {
    const courses = await this.dataSource.getRepository(Course).find({
      order: { title: 'ASC' },
    });
    const batches = await this.dataSource.getRepository(Batch).find({
      relations: { course: true },
      order: { title: 'ASC' },
    });
    return {
      courses: courses.map((course) => ({
        id: course.id,
        title: course.title,
        isPublished: course.isPublished,
      })),
      batches: batches.map((batch) => ({
        id: batch.id,
        title: batch.title,
        code: batch.code,
        courseId: batch.course.id,
      })),
    };
  }

  async findOne(id: string) {
    return this.map(await this.recording(id));
  }

  async create(dto: CreateClassRecordingDto, actorId: string) {
    const { course, batch } = await this.validateRelations(dto.courseId, dto.batchId);
    const recording = await this.repository.save(
      this.repository.create({
        title: dto.title.trim(),
        description: dto.description?.trim() || undefined,
        videoUrl: dto.videoUrl.trim(),
        resourceUrl: dto.resourceUrl?.trim() || undefined,
        recordedDate: dto.recordedDate,
        isPublished: dto.isPublished ?? true,
        course,
        batch: batch || undefined,
      }),
    );
    await this.log(actorId, 'create', recording.id, { courseId: course.id, batchId: batch?.id });
    if (recording.isPublished) {
      await this.notifyStudentsAboutRecording(recording.title, course.id, batch?.id);
    }
    return this.findOne(recording.id);
  }

  async update(id: string, dto: UpdateClassRecordingDto, actorId: string) {
    const recording = await this.recording(id);
    const wasPublished = recording.isPublished;
    const courseId = dto.courseId ?? recording.course.id;
    const batchId = dto.batchId !== undefined ? dto.batchId : recording.batch?.id;
    const { course, batch } = await this.validateRelations(courseId, batchId);
    
    recording.course = course;
    recording.batch = batch || undefined;

    const fields: Array<keyof UpdateClassRecordingDto> = [
      'title',
      'description',
      'videoUrl',
      'resourceUrl',
      'recordedDate',
      'isPublished',
    ];
    for (const field of fields) {
      if (dto[field] !== undefined) {
        (recording as unknown as Record<string, unknown>)[field] =
          typeof dto[field] === 'string'
            ? (dto[field] as string).trim() || undefined
            : dto[field];
      }
    }

    await this.repository.save(recording);
    await this.log(actorId, 'update', id, { fields: Object.keys(dto) });
    if (!wasPublished && recording.isPublished) {
      await this.notifyStudentsAboutRecording(recording.title, course.id, batch?.id);
    }
    return this.findOne(id);
  }

  async setPublished(id: string, isPublished: boolean, actorId: string) {
    const recording = await this.recording(id);
    const wasPublished = recording.isPublished;
    recording.isPublished = isPublished;
    await this.repository.save(recording);
    await this.log(actorId, isPublished ? 'publish' : 'unpublish', id);
    if (!wasPublished && isPublished) {
      await this.notifyStudentsAboutRecording(recording.title, recording.course.id, recording.batch?.id);
    }
    return {
      message: `Class recording ${isPublished ? 'published' : 'unpublished'} successfully`,
      isPublished,
    };
  }

  async remove(id: string, actorId: string) {
    const recording = await this.recording(id);
    await this.repository.remove(recording);
    await this.log(actorId, 'delete', id, { title: recording.title });
    return { message: 'Class recording deleted successfully' };
  }

  private async recording(id: string) {
    const recording = await this.repository.findOne({
      where: { id },
      relations: { course: true, batch: true },
    });
    if (!recording) throw new NotFoundException('Class recording not found');
    return recording;
  }

  private async validateRelations(courseId: string, batchId?: string) {
    const course = await this.dataSource.getRepository(Course).findOne({
      where: { id: courseId },
    });
    if (!course) throw new BadRequestException('Course not found');

    let batch: Batch | null = null;
    if (batchId) {
      batch = await this.dataSource.getRepository(Batch).findOne({
        where: { id: batchId, course: { id: courseId } },
      });
      if (!batch) {
        throw new BadRequestException('Batch does not belong to the selected course');
      }
    }

    return { course, batch };
  }

  private map(recording: ClassRecording) {
    return {
      id: recording.id,
      title: recording.title,
      description: recording.description ?? '',
      courseId: recording.course.id,
      courseTitle: recording.course.title,
      batchId: recording.batch?.id ?? '',
      batchTitle: recording.batch?.title ?? '',
      batchCode: recording.batch?.code ?? '',
      videoUrl: recording.videoUrl,
      resourceUrl: recording.resourceUrl ?? '',
      recordedDate: recording.recordedDate,
      isPublished: recording.isPublished,
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt,
    };
  }

  private async log(
    actorId: string,
    action: string,
    recordId: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.dataSource.getRepository(AuditLog).save({
      user: { id: actorId } as User,
      action,
      module: 'class-recordings',
      recordId,
      metadata,
    });
  }

  private async notifyStudentsAboutRecording(title: string, courseId: string, batchId?: string) {
    const input = {
      title: 'New class recording uploaded',
      message: `${title} is now available in your class recordings.`,
      type: 'class' as const,
      actionUrl: '/student/class-recordings',
    };
    if (batchId) {
      await this.studentNotifications.notifyBatchStudents(batchId, input, ['active']);
      return;
    }
    await this.studentNotifications.notifyCourseStudents(courseId, input, ['active']);
  }
}
