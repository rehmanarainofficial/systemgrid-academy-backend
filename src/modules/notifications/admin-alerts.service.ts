import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { Notification, NotificationType, User } from '../../database/entities';

type AdminAlertPayload = {
  title: string;
  message: string;
  type: NotificationType;
  actionUrl: string;
};

@Injectable()
export class AdminAlertsService {
  constructor(private readonly dataSource: DataSource) {}

  async notifyAdmins(payload: AdminAlertPayload) {
    const admins = await this.dataSource.getRepository(User).find({
      where: {
        isActive: true,
        role: In([UserRole.SuperAdmin, UserRole.Admin, UserRole.Staff]),
      },
    });
    if (!admins.length) return;

    await this.dataSource.transaction(async (manager) => {
      for (const admin of admins) {
        await manager.save(Notification, manager.create(Notification, {
          user: admin,
          title: payload.title.trim(),
          message: payload.message.trim(),
          type: payload.type,
          actionUrl: payload.actionUrl,
        }));
      }
    });
  }
}
