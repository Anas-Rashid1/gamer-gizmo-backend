// import {
//   BadRequestException,
//   Injectable,
//   InternalServerErrorException,
// } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateBlogDto } from './dto/createblogs.dto';
// import { GetBlogsDto } from './dto/getblogs.dto';
// import { DeleteBlogsDto } from './dto/deletebrands.dto';
// import { UpdateBlogDto } from './dto/updateblogs.dto';
// import { S3Service } from 'src/utils/s3.service';

// @Injectable()
// export class BlogsService {
//   constructor(
//     private prisma: PrismaService,
//     private s3Service: S3Service,
//   ) {}

//   async GetAllBlogs({ pageNo }: GetBlogsDto) {
//     try {
//       const limit = 10;
//       const queryOptions: any = {};

//       if (pageNo) {
//         queryOptions.skip = (parseInt(pageNo) - 1) * limit;
//         queryOptions.take = limit;
//       }

//       const blogs = await this.prisma.blog_posts.findMany(queryOptions);

//       const enriched = await Promise.all(
//         blogs.map(async (blog) => {
//           const imageUrl = blog.images
//             ? await this.s3Service.get_image_url(blog.images)
//             : null;
//           return { ...blog, images: imageUrl };
//         }),
//       );

//       return { message: 'Success', data: enriched };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }

//   async GetSingleBlogsDetails({ id, title }: { id?: string; title?: string }) {
//     try {
//       // Ensure at least one parameter is provided
//       if (!id && !title) {
//         throw new BadRequestException('Either ID or title must be provided');
//       }

//       let blogId: number;

//       // If title is provided, find the blog by title
//       if (title && !id) {
//         const blogByTitle = await this.prisma.blog_posts.findFirst({
//           where: { title },
//           select: { id: true },
//         });

//         if (!blogByTitle) {
//           throw new BadRequestException('Blog not found');
//         }
//         blogId = blogByTitle.id;
//       } else {
//         blogId = parseInt(id);
//       }

//       // Fetch the blog and increment the views count atomically
//       const blog = await this.prisma.blog_posts.update({
//         where: { id: blogId },
//         data: {
//           views: { increment: 1 },
//         },
//         select: {
//           id: true,
//           admin_id: true,
//           title: true,
//           content: true,
//           images: true,
//           created_at: true,
//           updated_at: true,
//           is_verified: true,
//           verified_by: true,
//           is_published: true,
//           tags: true,
//           views: true,
//         },
//       });

//       if (!blog) {
//         throw new BadRequestException('Blog not found');
//       }

//       const imageUrl = blog.images
//         ? await this.s3Service.get_image_url(blog.images)
//         : null;

//       return { message: 'Success', data: { ...blog, images: imageUrl } };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async GetRecentsBlogs() {
//     try {
//       const blogs = await this.prisma.blog_posts.findMany({
//         orderBy: { created_at: 'desc' },
//         take: 4,
//       });

//       const enriched = await Promise.all(
//         blogs.map(async (blog) => {
//           const imageUrl = blog.images
//             ? await this.s3Service.get_image_url(blog.images)
//             : null;
//           return { ...blog, images: imageUrl };
//         }),
//       );

//       return { message: 'Success', data: enriched };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }

//   async DeleteBlog({ id }: DeleteBlogsDto) {
//     try {
//       const blog = await this.prisma.blog_posts.findUnique({
//         where: { id: parseInt(id) },
//       });

//       if (!blog) {
//         throw new BadRequestException(`Blog with id ${id} does not exist.`);
//       }

//       if (blog.images) {
//         await this.s3Service.deleteFileByKey(blog.images);
//       }

//       await this.prisma.blog_posts.delete({
//         where: { id: parseInt(id) },
//       });

//       return { message: 'Successfully Deleted' };
//     } catch (e) {
//       throw new InternalServerErrorException(
//         e.message || 'Failed to delete the blog.',
//       );
//     }
//   }


//    async createBlog(data: CreateBlogDto, image: Express.Multer.File) {
//     try {
//       const uploaded = await this.s3Service.upload_file({
//         ...image,
//         originalname: image.originalname,
//         buffer: image.buffer,
//       });

//       const blog = await this.prisma.blog_posts.create({
//         data: {
//           admin_id: parseInt(data.admin_id),
//           verified_by: parseInt(data.admin_id),
//           title: data.title,
//           tags: data.tags,
//           content: data.content,
//           images: uploaded.Key, // Save relative path
//           views: 0, // Initialize views
//         },
//       });

//       return { message: 'Successfully Created' };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }

//   async updateBlog(data: UpdateBlogDto, image: Express.Multer.File) {
//     try {
//       const blog = await this.prisma.blog_posts.findUnique({
//         where: { id: parseInt(data.id) },
//       });

//       if (!blog) {
//         throw new BadRequestException('No Blog Found');
//       }

//       const updates: any = {
//         updated_at: new Date(),
//       };

//       if (data.title) updates.title = data.title;
//       if (data.content) updates.content = data.content;
//       if (data.tags) updates.tags = data.tags;

//       if (image) {
//         if (blog.images) {
//           await this.s3Service.deleteFileByKey(blog.images);
//         }

//         const uploaded = await this.s3Service.upload_file({
//           ...image,
//           originalname: image.originalname,
//           buffer: image.buffer,
//         });

//         updates.images = uploaded.Key;
//       }

//       await this.prisma.blog_posts.update({
//         where: { id: parseInt(data.id) },
//         data: updates,
//       });

//       return { message: 'Successfully Updated' };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async GetMostVisitedBlogs({ limit }: { limit?: number }) {
//     try {
//       const queryOptions: any = {
//         orderBy: { views: 'desc' },
//         take: limit ? parseInt(limit.toString()) : 10,
//       };

//       const blogs = await this.prisma.blog_posts.findMany(queryOptions);

//       const enriched = await Promise.all(
//         blogs.map(async (blog) => {
//           const imageUrl = blog.images
//             ? await this.s3Service.get_image_url(blog.images)
//             : null;
//           return { ...blog, images: imageUrl };
//         }),
//       );

//       return { message: 'Success', data: enriched };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
// }



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

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 100);
  }

  async GetAllBlogs({ pageNo }: GetBlogsDto) {
    try {
      const limit = 10;
      const queryOptions: any = {
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
          slug: true,
        },
      };

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
      throw new InternalServerErrorException(e.message || 'Failed to fetch blogs');
    }
  }

  async GetSingleBlogsDetails({ id, title, slug }: { id?: string; title?: string; slug?: string }) {
    try {
      // Ensure at least one parameter is provided
      if (!id && !title && !slug) {
        throw new BadRequestException('Either ID, title, or slug must be provided');
      }

      let blogId: number;

      // Find blog by slug first if provided
      if (slug) {
        const blogBySlug = await this.prisma.blog_posts.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (!blogBySlug) {
          throw new BadRequestException('Blog not found');
        }
        blogId = blogBySlug.id;
      }
      // If title is provided and no slug, find by title
      else if (title) {
        const blogByTitle = await this.prisma.blog_posts.findFirst({
          where: { title },
          select: { id: true },
        });

        if (!blogByTitle) {
          throw new BadRequestException('Blog not found');
        }
        blogId = blogByTitle.id;
      }
      // Fallback to ID
      else {
        blogId = parseInt(id);
      }

      // Fetch the blog and increment the views count atomically
      const blog = await this.prisma.blog_posts.update({
        where: { id: blogId },
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
          slug: true,
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
      throw new InternalServerErrorException(e.message || 'Failed to fetch blog details');
    }
  }

  async GetRecentsBlogs() {
    try {
      const blogs = await this.prisma.blog_posts.findMany({
        orderBy: { created_at: 'desc' },
        take: 4,
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
          slug: true,
        },
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
      throw new InternalServerErrorException(e.message || 'Failed to fetch recent blogs');
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
      throw new InternalServerErrorException(e.message || 'Failed to delete the blog');
    }
  }

  async createBlog(data: CreateBlogDto, image: Express.Multer.File) {
    try {
      const uploaded = await this.s3Service.upload_file({
        ...image,
        originalname: image.originalname,
        buffer: image.buffer,
      });

      let slug = this.generateSlug(data.title);
      let uniqueSlug = slug;
      let counter = 1;

      // Ensure slug is unique
      while (await this.prisma.blog_posts.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      const blog = await this.prisma.blog_posts.create({
        data: {
          admin_id: parseInt(data.admin_id),
          verified_by: parseInt(data.admin_id),
          title: data.title,
          tags: data.tags,
          content: data.content,
          images: uploaded.Key,
          views: 0,
          slug: uniqueSlug,
        },
      });

      return { message: 'Successfully Created', data: { id: blog.id, slug: blog.slug } };
    } catch (e) {
      throw new InternalServerErrorException(e.message || 'Failed to create blog');
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

      if (data.title) {
        updates.title = data.title;
        let slug = this.generateSlug(data.title);
        let uniqueSlug = slug;
        let counter = 1;
        while (
          await this.prisma.blog_posts.findUnique({
            where: { slug: uniqueSlug },
          }) &&
          uniqueSlug !== blog.slug
        ) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }
        updates.slug = uniqueSlug;
      }
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

      const updatedBlog = await this.prisma.blog_posts.update({
        where: { id: parseInt(data.id) },
        data: updates,
      });

      return { message: 'Successfully Updated', data: { id: updatedBlog.id, slug: updatedBlog.slug } };
    } catch (e) {
      throw new InternalServerErrorException(e.message || 'Failed to update blog');
    }
  }

  async GetMostVisitedBlogs({ limit }: { limit?: number }) {
    try {
      const queryOptions: any = {
        orderBy: { views: 'desc' },
        take: limit ? parseInt(limit.toString()) : 10,
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
          slug: true,
        },
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
      throw new InternalServerErrorException(e.message || 'Failed to fetch most visited blogs');
    }
  }

  async GenerateSlugsForExistingBlogs() {
    try {
      const blogs = await this.prisma.blog_posts.findMany({
        where: { slug: null },
        select: { id: true, title: true },
      });

      const updatePromises = blogs.map(async (blog) => {
        let slug = this.generateSlug(blog.title);
        let uniqueSlug = slug;
        let counter = 1;
        while (await this.prisma.blog_posts.findUnique({ where: { slug: uniqueSlug } })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }
        await this.prisma.blog_posts.update({
          where: { id: blog.id },
          data: { slug: uniqueSlug },
        });
      });

      await Promise.all(updatePromises);

      return { message: 'Slugs generated successfully', count: blogs.length };
    } catch (e) {
      throw new InternalServerErrorException(e.message || 'Failed to generate slugs');
    }
  }
}