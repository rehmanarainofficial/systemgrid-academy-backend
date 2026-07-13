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
  Lesson,
  User,
} from '../../database/entities';
import { CreateInstructorAssignmentDto } from './dto/create-instructor-assignment.dto';
import { CreateInstructorLessonDto } from './dto/create-instructor-lesson.dto';
import { UpdateInstructorLessonDto } from './dto/update-instructor-lesson.dto';
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
      relations: { batch: true, lesson: true, course: true },
      order: { date: 'ASC' },
    });
    return schedules.map((s) => ({
      id: s.id,
      batchId: s.batch.id,
      batchTitle: s.batch.title,
      lessonTitle: s.lesson?.title ?? '',
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

  async getLessons(userId: string, courseId?: string) {
    const courseIds = await this.ownCourseIds(userId);
    if (!courseIds.length) return [];
    const filtered =
      courseId && courseIds.includes(courseId) ? [courseId] : courseIds;
    const lessons = await this.dataSource.getRepository(Lesson).find({
      where: { course: { id: In(filtered) } },
      relations: { course: true, module: true },
      order: { sortOrder: 'ASC' },
    });
    return lessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description ?? '',
      courseId: l.course.id,
      courseTitle: l.course.title,
      moduleId: l.module?.id ?? '',
      moduleTitle: l.module?.title ?? '',
      videoUrl: l.videoUrl ?? '',
      resourceUrl: l.resourceUrl ?? '',
      durationMinutes: l.durationMinutes ?? 0,
      isPublished: l.isPublished,
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

  async createLesson(userId: string, dto: CreateInstructorLessonDto) {
    const courseIds = await this.ownCourseIds(userId);
    if (!courseIds.includes(dto.courseId)) {
      throw new ForbiddenException('You do not teach this course');
    }
    const lesson = await this.dataSource.getRepository(Lesson).save(
      this.dataSource.getRepository(Lesson).create({
        course: { id: dto.courseId } as never,
        module: dto.moduleId ? ({ id: dto.moduleId } as never) : undefined,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        videoUrl: dto.videoUrl,
        resourceUrl: dto.resourceUrl,
        durationMinutes: dto.durationMinutes,
        isPublished: dto.isPublished ?? true,
      }),
    );
    return { id: lesson.id, message: 'Lesson uploaded' };
  }

  async updateLesson(userId: string, lessonId: string, dto: UpdateInstructorLessonDto) {
    const courseIds = await this.ownCourseIds(userId);
    const repo = this.dataSource.getRepository(Lesson);
    const lesson = await repo.findOne({
      where: { id: lessonId, course: { id: In(courseIds) } },
      relations: { course: true, module: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (dto.title !== undefined) lesson.title = dto.title.trim();
    if (dto.description !== undefined) lesson.description = dto.description.trim() || undefined;
    if (dto.videoUrl !== undefined) lesson.videoUrl = dto.videoUrl || undefined;
    if (dto.resourceUrl !== undefined) lesson.resourceUrl = dto.resourceUrl || undefined;
    if (dto.durationMinutes !== undefined) lesson.durationMinutes = dto.durationMinutes;
    if (dto.moduleId !== undefined) lesson.module = dto.moduleId ? ({ id: dto.moduleId } as never) : undefined;
    if (dto.isPublished !== undefined) lesson.isPublished = dto.isPublished;
    await repo.save(lesson);
    return { id: lesson.id, message: 'Lesson updated' };
  }

  async deleteLesson(userId: string, lessonId: string) {
    const courseIds = await this.ownCourseIds(userId);
    const repo = this.dataSource.getRepository(Lesson);
    const lesson = await repo.findOne({
      where: { id: lessonId, course: { id: In(courseIds) } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await repo.remove(lesson);
    return { message: 'Lesson deleted' };
  }

  private async ownCourseIds(userId: string): Promise<string[]> {
    const instructor = await this.instructor(userId);
    const batches = await this.dataSource.getRepository(Batch).find({
      where: { instructor: { id: instructor.id } },
      relations: { course: true },
    });
    return [...new Set(batches.map((b) => b.course?.id).filter(Boolean))] as string[];
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
