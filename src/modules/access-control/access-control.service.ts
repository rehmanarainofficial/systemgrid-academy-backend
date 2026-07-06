import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ACCESS_RESOURCES,
  ACCESS_RESOURCE_KEYS,
  defaultLevel,
  MANAGED_ROLES,
} from '../../common/access/access-resources';
import { AccessLevel, satisfies } from '../../common/enums/access-level.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { RolePermission } from '../../database/entities';
import { UpdateAccessControlDto } from './dto/update-access-control.dto';

@Injectable()
export class AccessControlService implements OnModuleInit {
  private readonly logger = new Logger(AccessControlService.name);
  // cache: role -> resource -> level
  private cache = new Map<string, Map<string, AccessLevel>>();

  constructor(
    @InjectRepository(RolePermission)
    private readonly repo: Repository<RolePermission>,
  ) {}

  async onModuleInit() {
    await this.ensureDefaults();
    await this.refreshCache();
  }

  // Seed any missing (managed role x resource) rows from the default matrix.
  private async ensureDefaults() {
    const existing = await this.repo.find();
    const seen = new Set(existing.map((r) => `${r.role}:${r.resource}`));
    const toInsert: Partial<RolePermission>[] = [];
    for (const role of MANAGED_ROLES) {
      for (const key of ACCESS_RESOURCE_KEYS) {
        if (!seen.has(`${role}:${key}`)) {
          toInsert.push({
            role,
            resource: key,
            accessLevel: defaultLevel(role, key),
          });
        }
      }
    }
    if (toInsert.length) {
      await this.repo.save(toInsert);
      this.logger.log(`Seeded ${toInsert.length} default permission rows`);
    }
  }

  async refreshCache() {
    const rows = await this.repo.find();
    const next = new Map<string, Map<string, AccessLevel>>();
    for (const row of rows) {
      if (!next.has(row.role)) next.set(row.role, new Map());
      next.get(row.role)!.set(row.resource, row.accessLevel);
    }
    this.cache = next;
  }

  getLevel(role: UserRole, resource: string): AccessLevel {
    if (role === UserRole.SuperAdmin) return AccessLevel.Full;
    return this.cache.get(role)?.get(resource) ?? defaultLevel(role, resource);
  }

  can(role: UserRole, resource: string, required: AccessLevel): boolean {
    if (role === UserRole.SuperAdmin) return true;
    return satisfies(this.getLevel(role, resource), required);
  }

  // Full matrix for the Access Control UI (managed roles only).
  getMatrix() {
    return {
      resources: ACCESS_RESOURCES,
      roles: MANAGED_ROLES,
      levels: Object.values(AccessLevel),
      matrix: MANAGED_ROLES.reduce<Record<string, Record<string, AccessLevel>>>(
        (acc, role) => {
          acc[role] = ACCESS_RESOURCE_KEYS.reduce<Record<string, AccessLevel>>(
            (row, key) => {
              row[key] = this.getLevel(role, key);
              return row;
            },
            {},
          );
          return acc;
        },
        {},
      ),
    };
  }

  // The caller's own effective permissions, used by the frontend to filter
  // nav items. Any authenticated admin-console user may read this.
  getPermissionsForRole(role: UserRole) {
    const permissions = ACCESS_RESOURCE_KEYS.reduce<Record<string, AccessLevel>>(
      (acc, key) => {
        acc[key] = this.getLevel(role, key);
        return acc;
      },
      {},
    );
    return {
      role,
      isSuperAdmin: role === UserRole.SuperAdmin,
      permissions,
    };
  }

  async update(dto: UpdateAccessControlDto) {
    const valid = new Set<string>(ACCESS_RESOURCE_KEYS);
    for (const change of dto.changes) {
      if (!MANAGED_ROLES.includes(change.role)) {
        continue; // never allow editing SuperAdmin/Student here
      }
      if (!valid.has(change.resource)) {
        continue;
      }
      const existing = await this.repo.findOne({
        where: { role: change.role, resource: change.resource },
      });
      if (existing) {
        existing.accessLevel = change.accessLevel;
        await this.repo.save(existing);
      } else {
        await this.repo.save(
          this.repo.create({
            role: change.role,
            resource: change.resource,
            accessLevel: change.accessLevel,
          }),
        );
      }
    }
    await this.refreshCache();
    return this.getMatrix();
  }

  async resetDefaults() {
    for (const role of MANAGED_ROLES) {
      for (const key of ACCESS_RESOURCE_KEYS) {
        const existing = await this.repo.findOne({
          where: { role, resource: key },
        });
        const level = defaultLevel(role, key);
        if (existing) {
          existing.accessLevel = level;
          await this.repo.save(existing);
        } else {
          await this.repo.save(
            this.repo.create({ role, resource: key, accessLevel: level }),
          );
        }
      }
    }
    await this.refreshCache();
    return this.getMatrix();
  }
}
