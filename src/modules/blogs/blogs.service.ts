import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AuditLog, BlogPost, User } from '../../database/entities';
import { AdminBlogQueryDto, PublicBlogQueryDto } from './dto/blog-query.dto';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly blogPostsRepository: Repository<BlogPost>,
    private readonly dataSource: DataSource,
  ) {}

  async findPublicPosts(query: PublicBlogQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.blogPostsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.isPublished = true')
      .orderBy('post.publishedAt', 'DESC')
      .addOrderBy('post.createdAt', 'DESC');

    this.applySearch(builder, query.search);
    if (query.category?.trim()) {
      builder.andWhere('LOWER(post.category) = LOWER(:category)', {
        category: query.category.trim(),
      });
    }

    const [posts, totalItems] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const categories = await this.blogPostsRepository
      .createQueryBuilder('post')
      .select('DISTINCT post.category', 'category')
      .where('post.isPublished = true')
      .orderBy('post.category', 'ASC')
      .getRawMany<{ category: string }>();

    return {
      posts: posts.map((post) => this.mapPost(post, false)),
      categories: categories.map(({ category }) => category),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async findPublicPost(slug: string) {
    const post = await this.blogPostsRepository.findOne({
      where: { slug, isPublished: true },
      relations: { author: true },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return this.mapPost(post, true);
  }

  async findAdminPosts(query: AdminBlogQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.blogPostsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .orderBy('post.updatedAt', 'DESC');

    this.applySearch(builder, query.search);
    if (query.category?.trim()) {
      builder.andWhere('LOWER(post.category) = LOWER(:category)', {
        category: query.category.trim(),
      });
    }
    if (query.status === 'published')
      builder.andWhere('post.isPublished = true');
    if (query.status === 'draft') builder.andWhere('post.isPublished = false');

    const [posts, totalItems] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const [total, published] = await Promise.all([
      this.blogPostsRepository.count(),
      this.blogPostsRepository.count({ where: { isPublished: true } }),
    ]);

    return {
      summary: { total, published, drafts: total - published },
      posts: posts.map((post) => this.mapPost(post, true)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      },
    };
  }

  async findAdminPost(id: string) {
    const post = await this.blogPostsRepository.findOne({
      where: { id },
      relations: { author: true },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return this.mapPost(post, true);
  }

  async create(dto: CreateBlogPostDto, actorId: string) {
    const isPublished = dto.isPublished ?? false;
    const post = this.blogPostsRepository.create({
      author: { id: actorId } as User,
      title: dto.title.trim(),
      slug: await this.createUniqueSlug(dto.slug || dto.title),
      excerpt: dto.excerpt.trim(),
      content: dto.content.trim(),
      coverImageUrl: dto.coverImageUrl?.trim() || undefined,
      category: dto.category.trim(),
      tags: this.cleanTags(dto.tags),
      seoTitle: dto.seoTitle?.trim() || undefined,
      seoDescription: dto.seoDescription?.trim() || undefined,
      isPublished,
      publishedAt: isPublished ? new Date() : undefined,
    });
    const saved = await this.blogPostsRepository.save(post);
    await this.logAction(actorId, 'create', saved.id, {
      slug: saved.slug,
      isPublished,
    });
    return this.findAdminPost(saved.id);
  }

  async update(id: string, dto: UpdateBlogPostDto, actorId: string) {
    const post = await this.blogPostsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');

    if (dto.slug !== undefined || (dto.title !== undefined && !post.slug)) {
      post.slug = await this.createUniqueSlug(
        dto.slug || dto.title || post.title,
        id,
      );
    }
    if (dto.title !== undefined) post.title = dto.title.trim();
    if (dto.excerpt !== undefined) post.excerpt = dto.excerpt.trim();
    if (dto.content !== undefined) post.content = dto.content.trim();
    if (dto.coverImageUrl !== undefined)
      post.coverImageUrl = dto.coverImageUrl.trim() || undefined;
    if (dto.category !== undefined) post.category = dto.category.trim();
    if (dto.tags !== undefined) post.tags = this.cleanTags(dto.tags);
    if (dto.seoTitle !== undefined)
      post.seoTitle = dto.seoTitle.trim() || undefined;
    if (dto.seoDescription !== undefined)
      post.seoDescription = dto.seoDescription.trim() || undefined;
    if (dto.isPublished !== undefined && dto.isPublished !== post.isPublished) {
      post.isPublished = dto.isPublished;
      post.publishedAt = dto.isPublished
        ? (post.publishedAt ?? new Date())
        : undefined;
    }

    await this.blogPostsRepository.save(post);
    await this.logAction(actorId, 'update', id, { fields: Object.keys(dto) });
    return this.findAdminPost(id);
  }

  async setPublished(id: string, isPublished: boolean, actorId: string) {
    const post = await this.blogPostsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');
    post.isPublished = isPublished;
    post.publishedAt = isPublished
      ? (post.publishedAt ?? new Date())
      : undefined;
    await this.blogPostsRepository.save(post);
    await this.logAction(actorId, isPublished ? 'publish' : 'unpublish', id, {
      slug: post.slug,
    });
    return {
      message: `Blog post ${isPublished ? 'published' : 'moved to drafts'} successfully`,
      isPublished,
    };
  }

  async remove(id: string, actorId: string) {
    const post = await this.blogPostsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');
    await this.blogPostsRepository.remove(post);
    await this.logAction(actorId, 'delete', id, {
      title: post.title,
      slug: post.slug,
    });
    return { message: 'Blog post deleted successfully' };
  }

  private applySearch(
    builder: ReturnType<Repository<BlogPost>['createQueryBuilder']>,
    search?: string,
  ) {
    if (!search?.trim()) return;
    const value = `%${search.trim()}%`;
    builder.andWhere(
      new Brackets((where) =>
        where
          .where('post.title ILIKE :value', { value })
          .orWhere('post.excerpt ILIKE :value', { value })
          .orWhere('post.category ILIKE :value', { value })
          .orWhere(':plain = ANY(post.tags)', { plain: search.trim() }),
      ),
    );
  }

  private mapPost(post: BlogPost, includeContent: boolean) {
    const words = post.content.trim().split(/\s+/).filter(Boolean).length;
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      ...(includeContent ? { content: post.content } : {}),
      coverImageUrl: post.coverImageUrl ?? '',
      category: post.category,
      tags: post.tags ?? [],
      seoTitle: post.seoTitle ?? '',
      seoDescription: post.seoDescription ?? '',
      isPublished: post.isPublished,
      publishedAt: post.publishedAt ?? null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      readingTimeMinutes: Math.max(1, Math.ceil(words / 220)),
      author: post.author
        ? { id: post.author.id, name: post.author.name }
        : null,
    };
  }

  private normalizeSlug(value: string) {
    return (
      value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 180) || 'article'
    );
  }

  private async createUniqueSlug(value: string, excludedId?: string) {
    const base = this.normalizeSlug(value);
    let candidate = base;
    let suffix = 2;
    while (true) {
      const existing = await this.blogPostsRepository.findOne({
        where: { slug: candidate },
      });
      if (!existing || existing.id === excludedId) return candidate;
      candidate = `${base.slice(0, 174)}-${suffix}`;
      suffix += 1;
    }
  }

  private cleanTags(tags?: string[]) {
    return Array.from(
      new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean)),
    ).slice(0, 10);
  }

  private async logAction(
    actorId: string,
    action: string,
    recordId: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.dataSource.getRepository(AuditLog).save({
      user: { id: actorId } as User,
      action,
      module: 'blogs',
      recordId,
      metadata,
    });
  }
}
