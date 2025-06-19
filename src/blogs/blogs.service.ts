import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBlogDto } from './dto/createblogs.dto';
import { GetBlogsDto } from './dto/getblogs.dto';
import { DeleteBlogsDto } from './dto/deletebrands.dto';
import { UpdateBlogDto } from './dto/updateblogs.dto';
import { S3Service } from 'src/utils/s3.service';

@Injectable()
export class BlogsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async GetAllBlogs({ pageNo }: GetBlogsDto) {
    try {
      const limit = 10;
      const queryOptions: any = {};

      if (pageNo) {
        queryOptions.skip = (parseInt(pageNo) - 1) * limit;
        queryOptions.take = limit;
      }

      const blogs = await this.prisma.blog_posts.findMany(queryOptions);

      const enriched = await Promise.all(
        blogs.map(async (blog) => {
          const imageUrl = blog.images
            ? await this.s3Service.get_image_url(blog.images)
            : null;
          return { ...blog, images: imageUrl };
        }),
      );

      return { message: 'Success', data: enriched };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  // async GetSingleBlogsDetails({ id }) {
  //   try {
  //     const blog = await this.prisma.blog_posts.findUnique({
  //       where: { id: parseInt(id) },
  //     });

  //     if (!blog) {
  //       throw new BadRequestException('Blog not found');
  //     }

  //     const imageUrl = blog.images
  //       ? await this.s3Service.get_image_url(blog.images)
  //       : null;

  //     return { message: 'Success', data: { ...blog, images: imageUrl } };
  //   } catch (e) {
  //     throw new InternalServerErrorException(e);
  //   }
  // }
  async GetSingleBlogsDetails({ id }) {
    try {
      // Fetch the blog and increment the views count atomically
      const blog = await this.prisma.blog_posts.update({
        where: { id: parseInt(id) },
        data: {
          views: { increment: 1 },
        },
        select: {
          id: true,
          admin_id: true,
          title: true,
          content: true,
          images: true,
          created_at: true,
          updated_at: true,
          is_verified: true,
          verified_by: true,
          is_published: true,
          tags: true,
          views: true,
        },
      });

      if (!blog) {
        throw new BadRequestException('Blog not found');
      }

      const imageUrl = blog.images
        ? await this.s3Service.get_image_url(blog.images)
        : null;

      return { message: 'Success', data: { ...blog, images: imageUrl } };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async GetRecentsBlogs() {
    try {
      const blogs = await this.prisma.blog_posts.findMany({
        orderBy: { created_at: 'desc' },
        take: 4,
      });

      const enriched = await Promise.all(
        blogs.map(async (blog) => {
          const imageUrl = blog.images
            ? await this.s3Service.get_image_url(blog.images)
            : null;
          return { ...blog, images: imageUrl };
        }),
      );

      return { message: 'Success', data: enriched };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async DeleteBlog({ id }: DeleteBlogsDto) {
    try {
      const blog = await this.prisma.blog_posts.findUnique({
        where: { id: parseInt(id) },
      });

      if (!blog) {
        throw new BadRequestException(`Blog with id ${id} does not exist.`);
      }

      if (blog.images) {
        await this.s3Service.deleteFileByKey(blog.images);
      }

      await this.prisma.blog_posts.delete({
        where: { id: parseInt(id) },
      });

      return { message: 'Successfully Deleted' };
    } catch (e) {
      throw new InternalServerErrorException(
        e.message || 'Failed to delete the blog.',
      );
    }
  }

  // async createBlog(data: CreateBlogDto, image: Express.Multer.File) {
  //   try {
  //     const uploaded = await this.s3Service.upload_file({
  //       ...image,
  //       originalname: image.originalname,
  //       buffer: image.buffer,
  //     });

  //     const blog = await this.prisma.blog_posts.create({
  //       data: {
  //         admin_id: parseInt(data.admin_id),
  //         verified_by: parseInt(data.admin_id),
  //         title: data.title,
  //         tags: data.tags,
  //         content: data.content,
  //         images: uploaded.Key, // Save relative path
  //       },
  //     });

  //     return { message: 'Successfully Created' };
  //   } catch (e) {
  //     throw new InternalServerErrorException(e);
  //   }
  // }
   async createBlog(data: CreateBlogDto, image: Express.Multer.File) {
    try {
      const uploaded = await this.s3Service.upload_file({
        ...image,
        originalname: image.originalname,
        buffer: image.buffer,
      });

      const blog = await this.prisma.blog_posts.create({
        data: {
          admin_id: parseInt(data.admin_id),
          verified_by: parseInt(data.admin_id),
          title: data.title,
          tags: data.tags,
          content: data.content,
          images: uploaded.Key, // Save relative path
          views: 0, // Initialize views
        },
      });

      return { message: 'Successfully Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async updateBlog(data: UpdateBlogDto, image: Express.Multer.File) {
    try {
      const blog = await this.prisma.blog_posts.findUnique({
        where: { id: parseInt(data.id) },
      });

      if (!blog) {
        throw new BadRequestException('No Blog Found');
      }

      const updates: any = {
        updated_at: new Date(),
      };

      if (data.title) updates.title = data.title;
      if (data.content) updates.content = data.content;
      if (data.tags) updates.tags = data.tags;

      if (image) {
        if (blog.images) {
          await this.s3Service.deleteFileByKey(blog.images);
        }

        const uploaded = await this.s3Service.upload_file({
          ...image,
          originalname: image.originalname,
          buffer: image.buffer,
        });

        updates.images = uploaded.Key;
      }

      await this.prisma.blog_posts.update({
        where: { id: parseInt(data.id) },
        data: updates,
      });

      return { message: 'Successfully Updated' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async GetMostVisitedBlogs({ limit }: { limit?: number }) {
    try {
      const queryOptions: any = {
        orderBy: { views: 'desc' },
        take: limit ? parseInt(limit.toString()) : 10,
      };

      const blogs = await this.prisma.blog_posts.findMany(queryOptions);

      const enriched = await Promise.all(
        blogs.map(async (blog) => {
          const imageUrl = blog.images
            ? await this.s3Service.get_image_url(blog.images)
            : null;
          return { ...blog, images: imageUrl };
        }),
      );

      return { message: 'Success', data: enriched };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}


