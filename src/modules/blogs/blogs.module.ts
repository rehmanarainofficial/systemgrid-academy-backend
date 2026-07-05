import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPost } from '../../database/entities';
import { UploadsModule } from '../uploads/uploads.module';
import {
  AdminBlogsController,
  PublicBlogsController,
} from './blogs.controller';
import { BlogsService } from './blogs.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost]), UploadsModule],
  controllers: [PublicBlogsController, AdminBlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
