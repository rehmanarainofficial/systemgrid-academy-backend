import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Course } from '../../database/entities';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  async findPublicCourses(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.search
      ? [
          { isPublished: true, title: ILike(`%${query.search}%`) },
          { isPublished: true, shortDescription: ILike(`%${query.search}%`) },
        ]
      : { isPublished: true };

    const [items, total] = await this.coursesRepository.findAndCount({
      where,
      relations: { category: true },
      order: { isFeatured: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicCourseBySlug(slug: string) {
    const course = await this.coursesRepository.findOne({
      where: { slug, isPublished: true },
      relations: { category: true, modules: true, lessons: true },
      order: {
        modules: { sortOrder: 'ASC' },
        lessons: { sortOrder: 'ASC' },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }
}
