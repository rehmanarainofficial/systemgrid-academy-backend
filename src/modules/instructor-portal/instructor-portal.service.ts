import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { assertAttendanceDateWithinBatch } from '../../common/utils/batch-date.util';
import { getServerTimePayload } from '../../common/utils/pakistan-time.util';
import {
  Assignment,
  AssignmentSubmission,
  Attendance,
  Batch,
  ClassSchedule,
  CourseModule,
  Enrollment,
  Instructor,
  ClassRecording,
  User,
} from '../../database/entities';
import { CreateInstructorAssignmentDto } from './dto/create-instructor-assignment.dto';
import { CreateInstructorClassRecordingDto } from './dto/create-instructor-class-recording.dto';
import { UpdateInstructorClassRecordingDto } from './dto/update-instructor-class-recording.dto';
import { GradeInstructorSubmissionDto } from './dto/grade-instructor-submission.dto';
import { MarkInstructorAttendanceDto } from './dto/mark-instructor-attendance.dto';
import { StudentNotificationsService } from '../notifications/student-notifications.service';

@Injectable()
export class InstructorPortalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentNotifications: StudentNotificationsService,
  ) {}

  // Resolve the Instructor record linked to the logged-in user account.
  private async instructor(userId: string): Promise<Instructor> {
    const instructor = await this.dataSource
      .getRepository(Instructor)
      .findOne({ where: { user: { id: userId } }, relations: { user: true } });
    if (!instructor) {
      throw new ForbiddenException(
        'No instructor profile is linked to this account',
      );
    }
    return instructor;
  }

  private async ownBatch(userId: string, batchId: string): Promise<Batch> {
    const instructor = await this.instructor(userId);
    const batch = await this.dataSource
      .getRepository(Batch)
      .findOne({
        where: { id: batchId },
        relations: { instructor: true, course: true },
      });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.instructor?.id !== instructor.id) {
      throw new ForbiddenException('This batch is not assigned to you');
    }
    return batch;
  }

  private async ownBatchIds(userId: string): Promise<string[]> {
    const instructor = await this.instructor(userId);
    const batches = await this.dataSource
      .getRepository(Batch)
      .find({ where: { instructor: { id: instructor.id } } });
    return batches.map((b) => b.id);
  }

  async getDashboard(userId: string) {
    const instructor = await this.instructor(userId);
    const batches = await this.dataSource.getRepository(Batch).find({
      where: { instructor: { id: instructor.id } },
      relations: { course: true },
    });
    const batchIds = batches.map((b) => b.id);
    const [studentCount, upcomingClasses, pendingSubmissions] =
      await Promise.all([
        batchIds.length
          ? this.dataSource.getRepository(Enrollment).count({
              where: { batch: { id: In(batchIds) } },
            })
          : Promise.resolve(0),
        batchIds.length
          ? this.dataSource.getRepository(ClassSchedule).count({
              where: { batch: { id: In(batchIds) }, status: 'upcoming' as never },
            })
          : Promise.resolve(0),
        batchIds.length
          ? this.dataSource.getRepository(AssignmentSubmission).count({
              where: {
                assignment: { batch: { id: In(batchIds) } },
                status: 'submitted' as never,
              },
            })
          : Promise.resolve(0),
      ]);
    return {
      instructor: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email ?? '',
        specialization: instructor.specialization ?? '',
      },
      summary: {
        batches: batches.length,
        activeBatches: batches.filter((b) => b.status === ('active' as never))
          .length,
        students: studentCount,
        upcomingClasses,
        pendingSubmissions,
      },
      batches: batches.map((b) => this.mapBatch(b)),
    };
  }

  async getBatches(userId: string) {
    const instructor = await this.instructor(userId);
    const batches = await this.dataSource.getRepository(Batch).find({
      where: { instructor: { id: instructor.id } },
      relations: { course: true },
      order: { startDate: 'DESC' },
    });
    const counts = await Promise.all(
      batches.map((b) =>
        this.dataSource
          .getRepository(Enrollment)
          .count({ where: { batch: { id: b.id } } }),
      ),
    );
    return batches.map((b, i) => ({
      ...this.mapBatch(b),
      studentsCount: counts[i],
    }));
  }

  async getBatchDetail(userId: string, batchId: string) {
    const batch = await this.ownBatch(userId, batchId);
    const enrollments = await this.dataSource.getRepository(Enrollment).find({
      where: { batch: { id: batchId } },
      relations: { student: { user: true } },
    });
    return {
      ...this.mapBatch(batch),
      students: enrollments.map((e) => ({
        enrollmentId: e.id,
        studentId: e.student.id,
        name: e.student.user?.name ?? 'Student',
        email: e.student.user?.email ?? '',
        status: e.status,
        progress: Number(e.progressPercentage),
      })),
    };
  }

  async getSchedule(userId: string) {
    const batchIds = await this.ownBatchIds(userId);
    if (!batchIds.length) return [];
    const schedules = await this.dataSource.getRepository(ClassSchedule).find({
      where: { batch: { id: In(batchIds) } },
      relations: { batch: true, course: true },
      order: { date: 'ASC' },
    });
    return schedules.map((s) => ({
      id: s.id,
      batchId: s.batch.id,
      batchTitle: s.batch.title,
      lessonTitle: 'Interactive Live Class',
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      mode: s.mode,
      meetingUrl: s.meetingUrl ?? '',
      status: s.status,
      serverTime: getServerTimePayload(),
    }));
  }

  async getAttendanceData(userId: string, batchId: string, date?: string) {
    const batch = await this.ownBatch(userId, batchId);
    const enrollments = await this.dataSource.getRepository(Enrollment).find({
      where: { batch: { id: batchId } },
      relations: { student: { user: true } },
    });
    const existing = date
      ? await this.dataSource.getRepository(Attendance).find({
          where: { batch: { id: batchId }, date },
          relations: { student: true },
        })
      : [];
    const byStudent = new Map(existing.map((a) => [a.student.id, a]));
    return {
      batch: this.mapBatch(batch),
      date: date ?? null,
      students: enrollments.map((e) => ({
        studentId: e.student.id,
        name: e.student.user?.name ?? 'Student',
        status: byStudent.get(e.student.id)?.status ?? null,
        remarks: byStudent.get(e.student.id)?.remarks ?? '',
      })),
    };
  }

  async markAttendance(
    userId: string,
    batchId: string,
    dto: MarkInstructorAttendanceDto,
  ) {
    const batch = await this.ownBatch(userId, batchId);
    assertAttendanceDateWithinBatch(batch, dto.date);
    const repo = this.dataSource.getRepository(Attendance);
    let saved = 0;
    for (const record of dto.records) {
      const existing = await repo.findOne({
        where: {
          batch: { id: batchId },
          date: dto.date,
          student: { id: record.studentId },
        },
        relations: { student: true, batch: true },
      });
      if (existing) {
        existing.status = record.status as never;
        existing.remarks = record.remarks;
        existing.markedBy = { id: userId } as User;
        await repo.save(existing);
      } else {
        await repo.save(
          repo.create({
            batch: { id: batchId } as Batch,
            course: batch.course,
            student: { id: record.studentId } as never,
            classSchedule: dto.classScheduleId
              ? ({ id: dto.classScheduleId } as ClassSchedule)
              : undefined,
            date: dto.date,
            status: record.status as never,
            remarks: record.remarks,
            markedBy: { id: userId } as User,
          }),
        );
      }
      saved += 1;
    }
    for (const record of dto.records) {
      const statusLabel = record.status.charAt(0).toUpperCase() + record.status.slice(1);
      await this.studentNotifications.notifyStudent(record.studentId, {
        title: 'Attendance updated',
        message: `Your attendance for ${batch.title} on ${dto.date} was marked as ${statusLabel}.`,
        type: 'class',
        actionUrl: '/student/attendance',
      });
    }
    return { message: `Attendance saved for ${saved} students`, saved };
  }

  async getAssignments(userId: string) {
    const batchIds = await this.ownBatchIds(userId);
    if (!batchIds.length) return [];
    const assignments = await this.dataSource.getRepository(Assignment).find({
      where: { batch: { id: In(batchIds) } },
      relations: { batch: true, course: true },
      order: { dueDate: 'DESC' },
    });
    const counts = await Promise.all(
      assignments.map((a) =>
        this.dataSource
          .getRepository(AssignmentSubmission)
          .count({ where: { assignment: { id: a.id } } }),
      ),
    );
    return assignments.map((a, i) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      batchId: a.batch?.id ?? '',
      batchTitle: a.batch?.title ?? '',
      courseTitle: a.course?.title ?? '',
      dueDate: a.dueDate,
      totalMarks: a.totalMarks,
      isPublished: a.isPublished,
      submissionsCount: counts[i],
    }));
  }

  async createAssignment(userId: string, dto: CreateInstructorAssignmentDto) {
    const batch = await this.ownBatch(userId, dto.batchId);
    const assignment = await this.dataSource.getRepository(Assignment).save(
      this.dataSource.getRepository(Assignment).create({
        course: batch.course,
        batch: { id: batch.id } as Batch,
        module: dto.moduleId ? ({ id: dto.moduleId } as never) : undefined,
        title: dto.title.trim(),
        description: dto.description.trim(),
        dueDate: new Date(dto.dueDate),
        totalMarks: dto.totalMarks,
        attachmentUrl: dto.attachmentUrl,
        isPublished: dto.isPublished ?? true,
      }),
    );
    if (assignment.isPublished) {
      await this.studentNotifications.notifyBatchStudents(batch.id, {
        title: 'New assignment',
        message: `A new assignment "${assignment.title}" was added to ${batch.title}.`,
        type: 'assignment',
        actionUrl: '/student/assignments',
      });
    }
    return { id: assignment.id, message: 'Assignment created' };
  }

  async getSubmissions(userId: string, assignmentId?: string) {
    const batchIds = await this.ownBatchIds(userId);
    if (!batchIds.length) return [];
    const submissions = await this.dataSource
      .getRepository(AssignmentSubmission)
      .find({
        where: {
          assignment: assignmentId
            ? { id: assignmentId, batch: { id: In(batchIds) } }
            : { batch: { id: In(batchIds) } },
        },
        relations: { assignment: true, student: { user: true } },
        order: { submittedAt: 'DESC' },
      });
    return submissions.map((s) => ({
      id: s.id,
      assignmentId: s.assignment.id,
      assignmentTitle: s.assignment.title,
      totalMarks: s.assignment.totalMarks,
      studentName: s.student.user?.name ?? 'Student',
      fileUrl: s.fileUrl ?? '',
      textAnswer: s.textAnswer ?? '',
      status: s.status,
      marksObtained: s.marksObtained ?? null,
      feedback: s.feedback ?? '',
      submittedAt: s.submittedAt,
    }));
  }

  async gradeSubmission(
    userId: string,
    submissionId: string,
    dto: GradeInstructorSubmissionDto,
  ) {
    const instructor = await this.instructor(userId);
    const repo = this.dataSource.getRepository(AssignmentSubmission);
    const submission = await repo.findOne({
      where: { id: submissionId },
      relations: { assignment: { batch: { instructor: true } } },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.assignment.batch?.instructor?.id !== instructor.id) {
      throw new ForbiddenException('This submission is not from your batch');
    }
    submission.marksObtained = dto.marksObtained;
    submission.feedback = dto.feedback;
    submission.status = 'checked' as never;
    submission.checkedAt = new Date();
    await repo.save(submission);
    return { message: 'Submission graded' };
  }

  async getClassRecordings(
    userId: string,
    courseId?: string,
    batchId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const courseIds = await this.ownCourseIds(userId);
    const batchIds = await this.ownBatchIds(userId);
    if (!courseIds.length) return [];

    const filteredCourses = courseId && courseIds.includes(courseId) ? [courseId] : courseIds;
    const builder = this.dataSource
      .getRepository(ClassRecording)
      .createQueryBuilder('recording')
      .leftJoinAndSelect('recording.course', 'course')
      .leftJoinAndSelect('recording.batch', 'batch')
      .where('course.id IN (:...courseIds)', { courseIds: filteredCourses })
      .orderBy('recording.recordedDate', 'DESC')
      .addOrderBy('recording.createdAt', 'DESC');

    if (batchId && batchIds.includes(batchId)) {
      builder.andWhere('batch.id = :batchId', { batchId });
    }
    if (dateFrom?.trim()) {
      builder.andWhere('recording.recordedDate >= :dateFrom', { dateFrom: dateFrom.trim() });
    }
    if (dateTo?.trim()) {
      builder.andWhere('recording.recordedDate <= :dateTo', { dateTo: dateTo.trim() });
    }

    const recordings = await builder.getMany();

    return recordings.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      courseId: r.course.id,
      courseTitle: r.course.title,
      batchId: r.batch?.id ?? '',
      batchTitle: r.batch?.title ?? '',
      batchCode: r.batch?.code ?? '',
      videoUrl: r.videoUrl,
      resourceUrl: r.resourceUrl ?? '',
      recordedDate: r.recordedDate,
      isPublished: r.isPublished,
    }));
  }

  async getCourseModules(userId: string, courseId: string) {
    const courseIds = await this.ownCourseIds(userId);
    if (!courseIds.includes(courseId)) {
      throw new ForbiddenException('You do not teach this course');
    }
    const modules = await this.dataSource.getRepository(CourseModule).find({
      where: { course: { id: courseId } },
      order: { sortOrder: 'ASC' },
    });
    return modules.map((module) => ({
      id: module.id,
      title: module.title,
      sortOrder: module.sortOrder,
    }));
  }

  async createClassRecording(userId: string, dto: CreateInstructorClassRecordingDto) {
    const courseIds = await this.ownCourseIds(userId);
    if (!courseIds.includes(dto.courseId)) {
      throw new ForbiddenException('You do not teach this course');
    }
    if (dto.batchId) {
      const batchIds = await this.ownBatchIds(userId);
      if (!batchIds.includes(dto.batchId)) {
        throw new ForbiddenException('You do not teach this batch');
      }
    }
    const recording = await this.dataSource.getRepository(ClassRecording).save(
      this.dataSource.getRepository(ClassRecording).create({
        course: { id: dto.courseId } as never,
        batch: dto.batchId ? ({ id: dto.batchId } as never) : undefined,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        videoUrl: dto.videoUrl.trim(),
        resourceUrl: dto.resourceUrl?.trim(),
        recordedDate: dto.recordedDate,
        isPublished: dto.isPublished ?? true,
      }),
    );
    if (recording.isPublished) {
      await this.notifyStudentsAboutRecording(recording.title, dto.courseId, dto.batchId);
    }
    return { id: recording.id, message: 'Class recording uploaded' };
  }

  async updateClassRecording(userId: string, recordingId: string, dto: UpdateInstructorClassRecordingDto) {
    const courseIds = await this.ownCourseIds(userId);
    const repo = this.dataSource.getRepository(ClassRecording);
    const recording = await repo.findOne({
      where: { id: recordingId, course: { id: In(courseIds) } },
      relations: { course: true, batch: true },
    });
    if (!recording) throw new NotFoundException('Class recording not found');

    const wasPublished = recording.isPublished;
    if (dto.title !== undefined) recording.title = dto.title.trim();
    if (dto.description !== undefined) recording.description = dto.description.trim() || undefined;
    if (dto.videoUrl !== undefined) recording.videoUrl = dto.videoUrl.trim();
    if (dto.resourceUrl !== undefined) recording.resourceUrl = dto.resourceUrl.trim() || undefined;
    if (dto.recordedDate !== undefined) recording.recordedDate = dto.recordedDate;
    if (dto.isPublished !== undefined) recording.isPublished = dto.isPublished;
    if (dto.batchId !== undefined) {
      if (dto.batchId) {
        const batchIds = await this.ownBatchIds(userId);
        if (!batchIds.includes(dto.batchId)) {
          throw new ForbiddenException('You do not teach this batch');
        }
        recording.batch = { id: dto.batchId } as never;
      } else {
        recording.batch = null as any;
      }
    }

    await repo.save(recording);
    if (!wasPublished && recording.isPublished) {
      await this.notifyStudentsAboutRecording(
        recording.title,
        recording.course.id,
        recording.batch?.id,
      );
    }
    return { id: recording.id, message: 'Class recording updated' };
  }

  async deleteClassRecording(userId: string, recordingId: string) {
    const courseIds = await this.ownCourseIds(userId);
    const repo = this.dataSource.getRepository(ClassRecording);
    const recording = await repo.findOne({
      where: { id: recordingId, course: { id: In(courseIds) } },
    });
    if (!recording) throw new NotFoundException('Class recording not found');
    await repo.remove(recording);
    return { message: 'Class recording deleted' };
  }

  private async ownCourseIds(userId: string): Promise<string[]> {
    const instructor = await this.instructor(userId);
    const batches = await this.dataSource.getRepository(Batch).find({
      where: { instructor: { id: instructor.id } },
      relations: { course: true },
    });
    return [...new Set(batches.map((b) => b.course?.id).filter(Boolean))] as string[];
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

  private mapBatch(batch: Batch) {
    return {
      id: batch.id,
      title: batch.title,
      code: batch.code,
      courseId: batch.course?.id ?? '',
      courseTitle: batch.course?.title ?? '',
      startDate: batch.startDate,
      endDate: batch.endDate ?? null,
      classDays: batch.classDays ?? [],
      startTime: batch.startTime ?? '',
      endTime: batch.endTime ?? '',
      mode: batch.mode,
      status: batch.status,
      meetingUrl: batch.meetingUrl ?? '',
    };
  }
}
