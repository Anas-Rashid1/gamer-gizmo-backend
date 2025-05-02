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

  async GetSingleBlogsDetails({ id }) {
    try {
      const blog = await this.prisma.blog_posts.findUnique({
        where: { id: parseInt(id) },
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
}


// import {
//   BadRequestException,
//   Injectable,
//   InternalServerErrorException,
// } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateBlogDto } from './dto/createblogs.dto';
// import { GetBlogsDto } from './dto/getblogs.dto';
// import { DeleteBlogsDto } from './dto/deletebrands.dto';
// import * as fs from 'fs/promises';
// import * as path from 'path';
// import { UpdateBlogDto } from './dto/updateblogs.dto';

// @Injectable()
// export class BlogsService {
//   constructor(private prisma: PrismaService) {}
//   async GetAllBlogs({ pageNo }: GetBlogsDto) {
//     try {
//       const limit = 10;
//       const queryOptions: any = {};
//       if (pageNo) {
//         queryOptions.skip = (parseInt(pageNo) - 1) * limit; // Calculate the offset
//         queryOptions.take = limit; // Limit the number of records
//       }

//       const brands = await this.prisma.blog_posts.findMany(queryOptions);
//       return { message: 'Success', data: brands };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async GetSingleBlogsDetails({ id }) {
//     try {
//       const queryOptions: any = {
//         where: {
//           id: parseInt(id),
//         },
//       };
//       const blogs = await this.prisma.blog_posts.findUnique(queryOptions);
//       return { message: 'Success', data: blogs };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async GetRecentsBlogs() {
//     try {
//       const limit = 4; // Limit to 4 recent blogs
//       const queryOptions: any = {
//         orderBy: {
//           created_at: 'desc', // Sort by created_at in descending order
//         },
//         take: limit, // Limit to 4 records
//       };

//       const blogs = await this.prisma.blog_posts.findMany(queryOptions);
//       return { message: 'Success', data: blogs };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async DeleteBlog({ id }: DeleteBlogsDto) {
//     try {
//       const brands = await this.prisma.blog_posts.findUnique({
//         where: {
//           id: parseInt(id),
//         },
//       });
//       // Check if the brand or its logo is missing
//       if (!brands) {
//         throw new BadRequestException(`Brand with id ${id} does not exist.`);
//       }

//       if (brands.images) {
//         try {
//           await fs.unlink(brands.images.slice(1)); // Remove first character if needed
//         } catch (unlinkError) {
//           console.warn(
//             `Failed to delete logo file: ${brands.images}`,
//             unlinkError,
//           );
//         }
//       }

//       await this.prisma.blog_posts.delete({
//         where: {
//           id: parseInt(id),
//         },
//       });

//       return { message: 'Successfully Deleted' };
//     } catch (e) {
//       console.error('Error deleting brand:', e);
//       throw new InternalServerErrorException(
//         e.message || 'Failed to delete the brand.',
//       );
//     }
//   }

//   async createBlog(data: CreateBlogDto, image: any) {
//     try {
//       console.log(data.admin_id, 'admin_id');
//       const blog = await this.prisma.blog_posts.create({
//         data: {
//           admin_id: parseInt(data.admin_id),
//           verified_by: parseInt(data.admin_id),
//           title: data.title,
//           tags: data.tags,
//           content: data.content,
//           images: `/public/blog_images/${image.filename}`,
//         },
//       });
//       return { message: 'Successfully Created' };
//     } catch (e) {
//       console.log(e);
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async updateBlog(data: UpdateBlogDto, image: any) {
//     try {
//       console.log(image, 'image');
//       const blogs = await this.prisma.blog_posts.findUnique({
//         where: {
//           id: parseInt(data.id),
//         },
//       });
//       if (!blogs) {
//         throw new BadRequestException('No Blog Found');
//       }
//       let dataToUpdate = {
//         updated_at: new Date(),
//       };
//       if (data.title) {
//         // @ts-expect-error jb jhg
//         dataToUpdate.title = data.title;
//       }
//       if (data.content) {
//         // @ts-expect-error jb jhg
//         dataToUpdate.content = data.content;
//       }
//       if (data.tags) {
//         // @ts-expect-error jb jhg
//         dataToUpdate.tags = data.tags;
//       }
//       if (image) {
//         if (blogs.images) {
//           await fs.unlink(blogs.images.slice(1));
//         }
//         // @ts-expect-error jb jhg
//         dataToUpdate.images = `/public/blog_images/${image.filename}`;
//       }
//       const blog = await this.prisma.blog_posts.update({
//         where: {
//           id: parseInt(data.id),
//         },
//         data: dataToUpdate,
//       });
//       return { message: 'Successfully Updated' };
//     } catch (e) {
//       console.log(e);
//       throw new InternalServerErrorException(e);
//     }
//   }
// }
