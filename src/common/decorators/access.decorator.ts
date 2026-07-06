import { applyDecorators, SetMetadata } from '@nestjs/common';
import { AccessLevel } from '../enums/access-level.enum';

export const ACCESS_RESOURCE_KEY = 'access_resource';
export const ACCESS_LEVEL_KEY = 'access_level';
export const SUPER_ADMIN_ONLY_KEY = 'super_admin_only';

// Guards a controller/handler behind the dynamic permission matrix for the
// given resource. If `level` is omitted, PermissionsGuard infers it from the
// HTTP method (GET/HEAD => Read, everything else => Full).
export function Access(resource: string, level?: AccessLevel) {
  const decorators = [SetMetadata(ACCESS_RESOURCE_KEY, resource)];
  if (level) {
    decorators.push(SetMetadata(ACCESS_LEVEL_KEY, level));
  }
  return applyDecorators(...decorators);
}

// Marks a single handler as SuperAdmin-only regardless of the matrix
// (e.g. destructive deletes). SuperAdmin already bypasses everything.
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY_KEY, true);
