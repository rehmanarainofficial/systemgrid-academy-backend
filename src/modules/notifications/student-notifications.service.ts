import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Enrollment, Notification, NotificationType, StudentProfile, User } from '../../database/entities';

type StudentNotificationInput = {
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
};

@Injectable()
export class StudentNotificationsService {
  constructor(private readonly dataSource: DataSource) {}

  async notifyUser(userId: string, input: StudentNotificationInput) {
    await this.dataSource.getRepository(Notification).save(
      this.dataSource.getRepository(Notification).create({
        user: { id: userId } as User,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type,
        actionUrl: input.actionUrl?.trim() || undefined,
      }),
    );
  }

  async notifyStudent(studentId: string, input: StudentNotificationInput) {
    const student = await this.dataSource.getRepository(StudentProfile).findOne({
      where: { id: studentId },
      relations: { user: true },
    });
    if (!student?.user?.id) return;
    await this.notifyUser(student.user.id, input);
  }

  async notifyBatchStudents(
    batchId: string,
    input: StudentNotificationInput,
    statuses: Array<'pending' | 'active'> = ['pending', 'active'],
  ) {
    const enrollments = await this.dataSource.getRepository(Enrollment).find({
      where: { batch: { id: batchId }, status: In(statuses) },
      relations: { student: { user: true } },
    });
    for (const enrollment of enrollments) {
      if (!enrollment.student?.user?.id) continue;
      await this.notifyUser(enrollment.student.user.id, input);
    }
  }

  async notifyCourseStudents(
    courseId: string,
    input: StudentNotificationInput,
    statuses: Array<'pending' | 'active'> = ['pending', 'active'],
  ) {
    const enrollments = await this.dataSource.getRepository(Enrollment).find({
      where: { course: { id: courseId }, status: In(statuses) },
      relations: { student: { user: true } },
    });
    const notifiedUserIds = new Set<string>();
    for (const enrollment of enrollments) {
      const userId = enrollment.student?.user?.id;
      if (!userId || notifiedUserIds.has(userId)) continue;
      notifiedUserIds.add(userId);
      await this.notifyUser(userId, input);
    }
  }
}
