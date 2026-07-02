import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { AuditLog, Course, CourseCategory, User } from '../../database/entities';
import { AdminCategoriesQueryDto } from './dto/admin-categories-query.dto';
import { CreateAdminCategoryDto } from './dto/create-admin-category.dto';
import { UpdateAdminCategoryDto } from './dto/update-admin-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(CourseCategory) private readonly repository: Repository<CourseCategory>, private readonly dataSource: DataSource) {}

  async findAll(query: AdminCategoriesQueryDto) {
    const builder = this.repository.createQueryBuilder('category')
      .loadRelationCountAndMap('category.coursesCount', 'category.courses')
      .orderBy('category.sortOrder', 'ASC').addOrderBy('category.name', 'ASC');
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      builder.andWhere(new Brackets((where) => where.where('category.name ILIKE :search', { search }).orWhere('category.slug ILIKE :search', { search }).orWhere('category.description ILIKE :search', { search })));
    }
    if (query.status === 'active') builder.andWhere('category.isActive = true');
    if (query.status === 'inactive') builder.andWhere('category.isActive = false');
    const categories = await builder.getMany();
    const [total, active] = await Promise.all([this.repository.count(), this.repository.count({ where: { isActive: true } })]);
    return { summary: { total, active, inactive: total - active }, categories: categories.map((item) => ({
      id: item.id, name: item.name, slug: item.slug, description: item.description ?? '', icon: item.icon ?? 'BookOpen', isActive: item.isActive,
      sortOrder: item.sortOrder, coursesCount: Number((item as CourseCategory & { coursesCount?: number }).coursesCount ?? 0), createdAt: item.createdAt, updatedAt: item.updatedAt,
    })) };
  }

  async create(dto: CreateAdminCategoryDto, actorId: string) {
    const slug = this.slug(dto.slug);
    await this.ensureUnique(slug);
    const category = await this.repository.save(this.repository.create({ ...dto, name: dto.name.trim(), slug, description: dto.description?.trim() || undefined }));
    await this.log(actorId, 'create', category.id, { slug });
    return category;
  }

  async update(id: string, dto: UpdateAdminCategoryDto, actorId: string) {
    const category = await this.get(id);
    if (dto.slug) { const slug = this.slug(dto.slug); await this.ensureUnique(slug, id); category.slug = slug; }
    if (dto.name !== undefined) category.name = dto.name.trim();
    if (dto.description !== undefined) category.description = dto.description.trim() || undefined;
    if (dto.icon !== undefined) category.icon = dto.icon || undefined;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;
    await this.repository.save(category);
    await this.log(actorId, 'update', id, { fields: Object.keys(dto) });
    return category;
  }

  async toggleStatus(id: string, actorId: string) {
    const category = await this.get(id);
    category.isActive = !category.isActive;
    await this.repository.save(category);
    await this.log(actorId, 'toggle_status', id, { isActive: category.isActive });
    return { message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`, isActive: category.isActive };
  }

  async remove(id: string, actorId: string) {
    const category = await this.get(id);
    const count = await this.dataSource.getRepository(Course).count({ where: { category: { id } } });
    if (count) throw new ConflictException('This category has courses attached. Move or delete courses first.');
    await this.repository.remove(category);
    await this.log(actorId, 'delete', id, { name: category.name });
    return { message: 'Category deleted successfully' };
  }

  private async get(id: string) { const item = await this.repository.findOne({ where: { id } }); if (!item) throw new NotFoundException('Category not found'); return item; }
  private slug(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  private async ensureUnique(slug: string, excludedId?: string) { const item = await this.repository.findOne({ where: { slug } }); if (item && item.id !== excludedId) throw new ConflictException('A category with this slug already exists'); }
  private async log(actorId: string, action: string, recordId: string, metadata?: Record<string, unknown>) { await this.dataSource.getRepository(AuditLog).save({ user: { id: actorId } as User, action, module: 'categories', recordId, metadata }); }
}
