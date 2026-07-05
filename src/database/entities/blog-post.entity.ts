import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from './academy.entities';

@Entity('blog_posts')
@Index('idx_blog_posts_is_published', ['isPublished'])
@Index('idx_blog_posts_published_at', ['publishedAt'])
@Index('idx_blog_posts_category', ['category'])
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'author_id' })
  author?: Relation<User>;

  @Column({ name: 'title', length: 160 })
  title: string;

  @Index('uq_blog_posts_slug', { unique: true })
  @Column({ name: 'slug', unique: true, length: 180 })
  slug: string;

  @Column({ name: 'excerpt', type: 'text' })
  excerpt: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'cover_image_url', nullable: true, length: 1000 })
  coverImageUrl?: string;

  @Column({ name: 'category', length: 80, default: 'Learning' })
  category: string;

  @Column({ name: 'tags', type: 'text', array: true, default: () => "'{}'" })
  tags: string[];

  @Column({ name: 'seo_title', nullable: true, length: 70 })
  seoTitle?: string;

  @Column({ name: 'seo_description', nullable: true, length: 170 })
  seoDescription?: string;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
