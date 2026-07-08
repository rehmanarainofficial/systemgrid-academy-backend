import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';
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

const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export type UploadedFileData = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Injectable()
export class UploadsService {
  private s3Client?: S3Client;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {}

  async save(file: UploadedFileData, dto: UploadResourceDto, actorId?: string) {
    if (!file?.buffer) throw new BadRequestException('File is required');
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }

    const folder = this.normalizeFolder(dto.module ?? dto.type ?? 'resources');
    const extension =
      extname(file.originalname ?? '') || this.extensionFromMime(file.mimetype);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const url = await this.persist(file, folder, fileName);
    await this.auditLogsRepository.save(
      this.auditLogsRepository.create({
        user: actorId ? ({ id: actorId } as User) : undefined,
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

  async saveImage(file: UploadedFileData, folder: string, actorId?: string) {
    if (!file?.buffer) throw new BadRequestException('Image is required');
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPG, PNG, and WebP images are supported',
      );
    }

    return this.save(file, { module: folder, type: 'image' }, actorId);
  }

  // All uploads go to AWS S3. Local disk storage is intentionally not
  // supported so no files are written to (or served from) the server.
  private async persist(
    file: UploadedFileData,
    folder: string,
    fileName: string,
  ) {
    return this.persistToS3(file, folder, fileName);
  }

  private async persistToS3(
    file: UploadedFileData,
    folder: string,
    fileName: string,
  ) {
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');
    if (!bucket || !region) {
      throw new InternalServerErrorException('S3 storage is not configured');
    }

    const key = `${folder}/${fileName}`;
    await this.getS3Client(region).send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const publicBaseUrl =
      this.configService
        .get<string>('AWS_S3_PUBLIC_BASE_URL')
        ?.replace(/\/$/, '') ?? `https://${bucket}.s3.${region}.amazonaws.com`;
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `${publicBaseUrl}/${encodedKey}`;
  }

  private getS3Client(region: string) {
    if (!this.s3Client) {
      // Prefer explicit credentials from configuration. Fall back to the AWS
      // default provider chain (e.g. an IAM role) when they are not set.
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>(
        'AWS_SECRET_ACCESS_KEY',
      );
      this.s3Client = new S3Client({
        region,
        maxAttempts: 3,
        ...(accessKeyId && secretAccessKey
          ? { credentials: { accessKeyId, secretAccessKey } }
          : {}),
      });
    }
    return this.s3Client;
  }

  private normalizeFolder(value: string) {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'resources'
    );
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
