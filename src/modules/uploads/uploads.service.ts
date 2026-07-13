import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
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

type SaveUploadOptions = {
  forceS3?: boolean;
};

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private s3Client?: S3Client;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {}

  async save(
    file: UploadedFileData,
    dto: UploadResourceDto,
    actorId?: string,
    options?: SaveUploadOptions,
  ) {
    if (!file?.buffer) throw new BadRequestException('File is required');
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }

    const folder = this.normalizeFolder(dto.module ?? dto.type ?? 'resources');
    const extension =
      extname(file.originalname ?? '') || this.extensionFromMime(file.mimetype);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const url = await this.persist(file, folder, fileName, options);
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

  async saveImage(
    file: UploadedFileData,
    folder: string,
    actorId?: string,
    options?: SaveUploadOptions,
  ) {
    if (!file?.buffer) throw new BadRequestException('Image is required');
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPG, PNG, and WebP images are supported',
      );
    }

    return this.save(file, { module: folder, type: 'image' }, actorId, options);
  }

  async deleteByUrl(url?: string | null) {
    const normalized = url?.trim();
    if (!normalized) return;

    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');
    const publicBaseUrl = this.configService
      .get<string>('AWS_S3_PUBLIC_BASE_URL')
      ?.replace(/\/$/, '');
    const s3Bases = [
      publicBaseUrl,
      bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com` : undefined,
    ].filter((value): value is string => Boolean(value));

    for (const base of s3Bases) {
      if (!normalized.startsWith(`${base}/`)) continue;
      const key = decodeURIComponent(normalized.slice(base.length + 1));
      if (bucket && region) {
        await this.deleteFromS3(bucket, region, key);
      }
      return;
    }

    const backendBaseUrl = this.configService
      .get<string>('BACKEND_PUBLIC_URL')
      ?.replace(/\/$/, '');
    const localPrefixes = [
      backendBaseUrl ? `${backendBaseUrl}/uploads/` : undefined,
      '/uploads/',
    ].filter((value): value is string => Boolean(value));

    for (const prefix of localPrefixes) {
      if (!normalized.startsWith(prefix)) continue;
      const relativePath = normalized.slice(prefix.length);
      const segments = relativePath.split('/').map((segment) => decodeURIComponent(segment));
      const uploadDir = this.configService.get<string>('UPLOAD_DIR') ?? 'uploads';
      const filePath = join(process.cwd(), uploadDir, ...segments);
      try {
        await unlink(filePath);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException | undefined)?.code;
        if (code !== 'ENOENT') {
          const message = error instanceof Error ? error.message : 'unknown error';
          this.logger.warn(`Failed to delete local upload ${filePath}: ${message}`);
        }
      }
      return;
    }
  }

  private async persist(
    file: UploadedFileData,
    folder: string,
    fileName: string,
    options?: SaveUploadOptions,
  ) {
    if (options?.forceS3) {
      return this.persistToS3(file, folder, fileName);
    }

    const driver = (
      this.configService.get<string>('STORAGE_DRIVER') ?? 'local'
    ).toLowerCase();
    if (driver === 'local') {
      return this.persistToLocal(file, folder, fileName);
    }

    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');
    const hasPlaceholderBucket =
      !bucket ||
      bucket.startsWith('replace-with') ||
      bucket.includes('your-bucket');
    if (!bucket || !region || hasPlaceholderBucket) {
      this.logger.warn(
        'STORAGE_DRIVER=s3 but S3 is not fully configured. Falling back to local uploads.',
      );
      return this.persistToLocal(file, folder, fileName);
    }

    try {
      return await this.persistToS3(file, folder, fileName);
    } catch (error) {
      const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'development';
      if (nodeEnv !== 'production') {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(
          `S3 upload failed in ${nodeEnv}; falling back to local uploads. ${message}`,
        );
        return this.persistToLocal(file, folder, fileName);
      }
      throw error;
    }
  }

  private async persistToLocal(
    file: UploadedFileData,
    folder: string,
    fileName: string,
  ) {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR') ?? 'uploads';
    const targetDir = join(process.cwd(), uploadDir, folder);
    await mkdir(targetDir, { recursive: true });
    await writeFile(join(targetDir, fileName), file.buffer);

    const baseUrl = this.configService
      .get<string>('BACKEND_PUBLIC_URL')
      ?.replace(/\/$/, '');
    if (!baseUrl) {
      throw new InternalServerErrorException(
        'BACKEND_PUBLIC_URL is required when STORAGE_DRIVER=local',
      );
    }

    const encodedPath = [folder, fileName]
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${baseUrl}/uploads/${encodedPath}`;
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
    try {
      await this.getS3Client(region).send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`S3 upload failed for ${key}: ${message}`);
      throw new InternalServerErrorException(
        'File upload failed. Set STORAGE_DRIVER=local in production, or verify AWS_S3_BUCKET, AWS_REGION, and S3 credentials/IAM permissions.',
      );
    }

    const publicBaseUrl =
      this.configService
        .get<string>('AWS_S3_PUBLIC_BASE_URL')
        ?.replace(/\/$/, '') ?? `https://${bucket}.s3.${region}.amazonaws.com`;
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `${publicBaseUrl}/${encodedKey}`;
  }

  private async deleteFromS3(bucket: string, region: string, key: string) {
    try {
      await this.getS3Client(region).send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Failed to delete S3 object ${key}: ${message}`);
    }
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
