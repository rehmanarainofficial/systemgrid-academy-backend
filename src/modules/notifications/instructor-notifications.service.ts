import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Enrollment, Notification, NotificationType, User } from '../../database/entities';

type InstructorNotificationInput = {
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
};

@Injectable()
export class InstructorNotificationsService {
  constructor(private readonly dataSource: DataSource) {}

  async notifyUser(userId: string, input: InstructorNotificationInput, manager?: EntityManager) {
    const repository = manager ?? this.dataSource.manager;
    await repository.save(
      Notification,
      repository.create(Notification, {
        user: { id: userId } as User,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type,
        actionUrl: input.actionUrl?.trim() || undefined,
      }),
    );
  }

  async notifyNewEnrollment(enrollmentId: string, manager?: EntityManager) {
    const repository = manager ?? this.dataSource.manager;
    const enrollment = await repository.findOne(Enrollment, {
      where: { id: enrollmentId },
      relations: {
        student: { user: true },
        course: true,
        batch: { instructor: { user: true } },
      },
    });

    const batch = enrollment?.batch;
    const instructorUserId = batch?.instructor?.user?.id;
    if (!enrollment || !batch || !instructorUserId) return;

    const studentName = enrollment.student?.user?.name ?? 'A student';
    const courseTitle = enrollment.course?.title ?? 'your course';
    const batchTitle = batch.title ?? 'your batch';
    const batchCode = batch.code ? ` (${batch.code})` : '';

    await this.notifyUser(
      instructorUserId,
      {
        title: 'New student enrolled',
        message: `${studentName} has been enrolled in ${batchTitle}${batchCode} for ${courseTitle}.`,
        type: 'info',
        actionUrl: `/instructor/batches/${batch.id}`,
      },
      manager,
    );
  }
}
