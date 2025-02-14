import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

import { CreateBlogDto } from './dto/createblogs.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GetBlogsDto } from './dto/getblogs.dto';
import { DeleteBlogsDto } from './dto/deletebrands.dto';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

@ApiTags('Blogs')
@Controller('/blogs')
export class BlogsContoller {
  constructor(private readonly blogsService: BlogsService) {}

  @Get('/getAll')
  @ApiQuery({
    name: 'pageNo',
    required: false, // Make pageNo optional
    type: Number,
    description:
      'Page number for pagination (if not provided, all brands will be returned)',
  })
  async GetAllBlogs(@Query() { pageNo = null }: GetBlogsDto) {
    return this.blogsService.GetAllBlogs({ pageNo });
  }
  @UseInterceptors(
    FileInterceptor('images', {
      storage: diskStorage({
        destination: function (req, file, cb) {
          cb(null, './public/blog_images');
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname); // Extract the file extension
          const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
          cb(null, fileName);
        },
      }),
    }),
  )
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create a new brand with logo',
    required: true,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Blog title' },
        content: { type: 'string', description: 'Blog Content' },
        tags: { type: 'string', description: 'Blog tags' },
        admin_id: {
          type: 'integer',
          description: 'admin ID to associate',
        },
        images: {
          type: 'string',
          format: 'binary', // Mark this field as a binary file for Swagger
          description: 'blog image file (image)',
        },
      },
    },
  })
  @Post('/create')
  async createBlog(
    @Body() CreateCategoriesDto: CreateBlogDto,
    @UploadedFile() images: Express.Multer.File,
  ) {
    return this.blogsService.createBlog(CreateCategoriesDto, images);
  }
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Delete('/delete')
  async DeleteBlog(@Query() id: DeleteBlogsDto) {
    return this.blogsService.DeleteBlog(id);
  }
}
