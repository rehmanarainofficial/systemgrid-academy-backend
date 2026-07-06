import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from '../../modules/access-control/access-control.service';
import {
  ACCESS_LEVEL_KEY,
  ACCESS_RESOURCE_KEY,
  SUPER_ADMIN_ONLY_KEY,
} from '../decorators/access.decorator';
import { AccessLevel } from '../enums/access-level.enum';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessControl: AccessControlService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const role: UserRole | undefined = request.user?.role;

    const superAdminOnly = this.reflector.getAllAndOverride<boolean>(
      SUPER_ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (superAdminOnly) {
      if (role !== UserRole.SuperAdmin) {
        throw new ForbiddenException('Requires super admin access');
      }
      return true;
    }

    const resource = this.reflector.getAllAndOverride<string>(
      ACCESS_RESOURCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    // No @Access on this route => nothing for this guard to enforce.
    if (!resource) {
      return true;
    }

    if (!role) {
      throw new ForbiddenException('Not authenticated');
    }
    if (role === UserRole.SuperAdmin) {
      return true;
    }

    const explicit = this.reflector.getAllAndOverride<AccessLevel>(
      ACCESS_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    );
    const method = String(request.method ?? 'GET').toUpperCase();
    const required =
      explicit ??
      (method === 'GET' || method === 'HEAD'
        ? AccessLevel.Read
        : AccessLevel.Full);

    if (!this.accessControl.can(role, resource, required)) {
      throw new ForbiddenException(
        `Your role does not have ${required} access to ${resource}`,
      );
    }
    return true;
  }
}
