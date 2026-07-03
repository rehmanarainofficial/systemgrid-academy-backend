import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { AuditLog } from '../../database/entities';
import { AdminAuditLogsQueryDto } from './dto/admin-audit-logs-query.dto';

type Severity = 'low' | 'medium' | 'high';

@Injectable()
export class AuditLogsService {
  constructor(@InjectRepository(AuditLog) private readonly auditLogs: Repository<AuditLog>) {}

  async findAll(query: AdminAuditLogsQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const builder = this.auditLogs
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC');

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(
        new Brackets((where) =>
          where
            .where('log.action ILIKE :search', { search })
            .orWhere('log.module ILIKE :search', { search })
            .orWhere('log.recordId ILIKE :search', { search })
            .orWhere('user.name ILIKE :search', { search })
            .orWhere('user.email ILIKE :search', { search }),
        ),
      );
    }
    if (query.module && query.module !== 'all') builder.andWhere('log.module = :module', { module: query.module });
    if (query.dateFrom) builder.andWhere('log.createdAt >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      builder.andWhere('log.createdAt <= :dateTo', { dateTo: to });
    }

    const allForSummary = await builder.clone().getMany();
    let rows = allForSummary;
    if (query.severity && query.severity !== 'all') {
      rows = rows.filter((item) => this.severityFor(item.action) === query.severity);
    }
    const totalItems = rows.length;
    const paged = rows.slice((page - 1) * limit, page * limit);
    const modules = Array.from(new Set(allForSummary.map((item) => item.module))).sort();

    return {
      summary: {
        total: rows.length,
        high: rows.filter((item) => this.severityFor(item.action) === 'high').length,
        medium: rows.filter((item) => this.severityFor(item.action) === 'medium').length,
        low: rows.filter((item) => this.severityFor(item.action) === 'low').length,
      },
      modules,
      logs: paged.map((item) => this.mapLog(item)),
      pagination: { page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) },
    };
  }

  async findOne(id: string) {
    const item = await this.auditLogs.findOne({ where: { id }, relations: { user: true } });
    if (!item) throw new NotFoundException('Audit log not found');
    return { log: this.mapLog(item) };
  }

  private mapLog(item: AuditLog) {
    return {
      id: item.id,
      actor: item.user
        ? { id: item.user.id, name: item.user.name, email: item.user.email, role: item.user.role }
        : { id: '', name: 'SystemGrid Academy', email: '', role: 'system' },
      action: item.action,
      module: item.module,
      recordId: item.recordId ?? '',
      severity: this.severityFor(item.action),
      metadata: this.sanitizeMetadata(item.metadata ?? {}),
      createdAt: item.createdAt,
    };
  }

  private severityFor(action: string): Severity {
    if (/delete|reject|revoke|cancel|archive/i.test(action)) return 'high';
    if (/update|reset|verify|mark|status|toggle/i.test(action)) return 'medium';
    return 'low';
  }

  private sanitizeMetadata(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sanitizeMetadata(item));
    if (!value || typeof value !== 'object') return value;
    const blocked = /password|token|jwt|secret|cookie|authorization|refresh/i;
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        blocked.test(key) ? '[redacted]' : this.sanitizeMetadata(nested),
      ]),
    );
  }
}
