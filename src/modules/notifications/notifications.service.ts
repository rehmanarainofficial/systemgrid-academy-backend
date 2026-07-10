import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource, In } from 'typeorm';
import { AuditLog, Batch, Course, Enrollment, Notification, StudentProfile, User } from '../../database/entities';
import { AdminInboxQueryDto } from './dto/admin-inbox-query.dto';
import { AdminNotificationsQueryDto } from './dto/admin-notifications-query.dto';
import { SendAdminNotificationDto } from './dto/send-admin-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(query: AdminNotificationsQueryDto) {
    const repository = this.dataSource.getRepository(AuditLog);
    const builder = repository.createQueryBuilder('log').leftJoinAndSelect('log.user', 'user').where('log.module = :module', { module: 'notifications' }).andWhere('log.action = :action', { action: 'send' }).orderBy('log.createdAt', 'DESC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => where.where("log.metadata ->> 'title' ILIKE :search", { search }).orWhere("log.metadata ->> 'message' ILIKE :search", { search })));
    }
    if (query.type !== 'all') builder.andWhere("log.metadata ->> 'type' = :type", { type: query.type });
    if (query.targetType !== 'all') builder.andWhere("log.metadata ->> 'targetType' = :targetType", { targetType: query.targetType });
    if (query.dateFrom) builder.andWhere('log.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo) builder.andWhere('log.createdAt <= :dateTo', { dateTo: query.dateTo });
    const [history, totalItems] = await builder.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const all = await repository.find({ where: { module: 'notifications', action: 'send' } });
    const countType = (type: string) => all.filter((item) => item.metadata?.type === type).length;
    return {
      summary: { totalSent: all.length, system: countType('system'), info: countType('info'), fee: countType('fee'), class: countType('class'), assignment: countType('assignment'), certificate: countType('certificate'), payment: countType('payment') },
      history: history.map((item) => this.mapHistory(item)),
      pagination: { page: query.page, limit: query.limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / query.limit)) },
    };
  }

  async options() {
    const [students, courses, batches] = await Promise.all([
      this.dataSource.getRepository(StudentProfile).find({ where: { status: 'active', user: { isActive: true } }, relations: { user: true }, order: { createdAt: 'DESC' }, take: 150 }),
      this.dataSource.getRepository(Course).find({ order: { title: 'ASC' } }),
      this.dataSource.getRepository(Batch).find({ relations: { course: true }, order: { startDate: 'DESC' } }),
    ]);
    return {
      students: students.map((student) => ({ id: student.id, name: student.user.name, email: student.user.email })),
      courses: courses.map((course) => ({ id: course.id, title: course.title })),
      batches: batches.map((batch) => ({ id: batch.id, title: batch.title, code: batch.code, courseId: batch.course.id, courseTitle: batch.course.title })),
    };
  }

  async count(userId: string) {
    const unreadCount = await this.dataSource.getRepository(Notification).count({
      where: { 
        user: { id: userId },
        isRead: false 
      }
    });
    return { unreadCount };
  }

  async inbox(userId: string, query: AdminInboxQueryDto) {
    const repository = this.dataSource.getRepository(Notification);
    const builder = repository.createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (query.status === 'unread') builder.andWhere('notification.isRead = false');
    if (query.status === 'read') builder.andWhere('notification.isRead = true');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [notifications, totalItems] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const unreadCount = await repository.count({
      where: { user: { id: userId }, isRead: false },
    });

    return {
      summary: { unread: unreadCount, total: totalItems },
      notifications: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        type: item.type,
        isRead: item.isRead,
        actionUrl: item.actionUrl ?? '',
        createdAt: item.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async markInboxAsRead(userId: string, notificationId: string) {
    const notification = await this.dataSource.getRepository(Notification).findOne({
      where: { id: notificationId, user: { id: userId } },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (!notification.isRead) {
      notification.isRead = true;
      await this.dataSource.getRepository(Notification).save(notification);
    }
    return { message: 'Notification marked as read' };
  }

  async markAllInboxAsRead(userId: string) {
    await this.dataSource.getRepository(Notification)
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = false')
      .execute();
    return { message: 'All notifications marked as read' };
  }

  async findOne(id: string) {
    const item = await this.dataSource.getRepository(AuditLog).findOne({ where: { id, module: 'notifications', action: 'send' }, relations: { user: true } });
    if (!item) throw new NotFoundException('Notification history not found');
    return this.mapHistory(item);
  }

  async send(dto: SendAdminNotificationDto, actorId: string) {
    const recipients = await this.resolveRecipients(dto);
    if (!recipients.length) throw new BadRequestException('No active student recipients found');
    const metadata = { title: dto.title.trim(), message: dto.message.trim(), type: dto.type, targetType: dto.targetType, courseId: dto.courseId, batchId: dto.batchId, actionUrl: dto.actionUrl?.trim() || this.defaultAction(dto.type), totalRecipients: recipients.length };
    await this.dataSource.transaction(async (manager) => {
      for (const student of recipients) {
        await manager.save(Notification, manager.create(Notification, { user: student.user, title: metadata.title, message: metadata.message, type: dto.type, actionUrl: metadata.actionUrl }));
      }
      await manager.save(AuditLog, manager.create(AuditLog, { user: { id: actorId } as User, action: 'send', module: 'notifications', recordId: `batch-${Date.now()}`, metadata }));
    });
    return { message: 'Notification sent successfully', totalRecipients: recipients.length };
  }

  async remove(id: string, actorId: string) {
    const item = await this.dataSource.getRepository(AuditLog).findOne({ where: { id, module: 'notifications', action: 'send' } });
    if (!item) throw new NotFoundException('Notification history not found');
    await this.dataSource.getRepository(AuditLog).remove(item);
    await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action: 'delete_history', module: 'notifications', recordId: id });
    return { message: 'Notification history deleted successfully' };
  }

  private async resolveRecipients(dto: SendAdminNotificationDto) {
    const repository = this.dataSource.getRepository(StudentProfile);
    if (dto.targetType === 'all_students') return repository.find({ where: { status: 'active', user: { isActive: true } }, relations: { user: true } });
    if (dto.targetType === 'selected_students') {
      if (!dto.studentIds?.length) throw new BadRequestException('Select at least one student');
      return repository.find({ where: { id: In(dto.studentIds), status: 'active', user: { isActive: true } }, relations: { user: true } });
    }
    if (dto.targetType === 'course_students') {
      if (!dto.courseId) throw new BadRequestException('Course is required for course students');
      const enrollments = await this.dataSource.getRepository(Enrollment).find({ where: { course: { id: dto.courseId }, student: { status: 'active', user: { isActive: true } } }, relations: { student: { user: true } } });
      return enrollments.map((item) => item.student);
    }
    if (!dto.batchId) throw new BadRequestException('Batch is required for batch students');
    const enrollments = await this.dataSource.getRepository(Enrollment).find({ where: { batch: { id: dto.batchId }, student: { status: 'active', user: { isActive: true } } }, relations: { student: { user: true } } });
    return enrollments.map((item) => item.student);
  }

  private mapHistory(item: AuditLog) {
    const meta = item.metadata ?? {};
    return { id: item.id, title: String(meta.title ?? ''), message: String(meta.message ?? ''), type: String(meta.type ?? 'system'), targetType: String(meta.targetType ?? 'all_students'), courseTitle: '', batchTitle: '', totalRecipients: Number(meta.totalRecipients ?? 0), sentByName: item.user?.name ?? 'SystemGrid Academy', actionUrl: String(meta.actionUrl ?? ''), createdAt: item.createdAt };
  }

  private defaultAction(type: string) {
    return ({ fee: '/student/payments', class: '/student/schedule', assignment: '/student/assignments', certificate: '/student/certificates', payment: '/student/payments', system: '/student/dashboard' } as Record<string, string>)[type] ?? '/student/dashboard';
  }
}
