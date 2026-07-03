import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import { AuditLog, User } from '../../database/entities';
import { UploadResourceDto } from './dto/upload-resource.dto';

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {}

  async save(file: any, dto: UploadResourceDto, actorId: string) {
    if (!file?.buffer) throw new BadRequestException('File is required');
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }

    const uploadRoot = this.configService.get<string>('UPLOAD_DIR') ?? 'uploads';
    const folder = this.normalizeFolder(dto.module ?? dto.type ?? 'resources');
    const extension = extname(file.originalname ?? '') || this.extensionFromMime(file.mimetype);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const directory = join(process.cwd(), uploadRoot, folder);
    const storagePath = join(directory, fileName);

    await mkdir(directory, { recursive: true });
    await writeFile(storagePath, file.buffer);

    const url = `/uploads/${folder}/${fileName}`;
    await this.auditLogsRepository.save(
      this.auditLogsRepository.create({
        user: { id: actorId } as User,
        action: 'upload',
        module: 'uploads',
        recordId: fileName,
        metadata: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          type: dto.type ?? 'resource',
          folder,
          url,
        },
      }),
    );

    return {
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type: dto.type ?? 'resource',
      url,
    };
  }

  private normalizeFolder(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'resources';
  }

  private extensionFromMime(mimeType: string) {
    if (mimeType === 'image/jpeg') return '.jpg';
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    if (mimeType === 'image/svg+xml') return '.svg';
    if (mimeType === 'application/pdf') return '.pdf';
    if (mimeType === 'text/plain') return '.txt';
    return '';
  }
}
