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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/createblogs.dto';
import { UpdateBlogDto } from './dto/updateblogs.dto';
import { DeleteBlogsDto } from './dto/deletebrands.dto';
import { GetBlogsDto } from './dto/getblogs.dto';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Blogs')
@Controller('/blogs')
export class BlogsContoller {
  constructor(private readonly blogsService: BlogsService) {}

  @Get('/getAll')
  @ApiQuery({
    name: 'pageNo',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  async GetAllBlogs(@Query() { pageNo = null }: GetBlogsDto) {
    return this.blogsService.GetAllBlogs({ pageNo });
  }

  @Get('/getRecentsBlogs')
  async GetRecentsBlogs() {
    return this.blogsService.GetRecentsBlogs();
  }

  @Get('/getSingleBlogsDetails')
  @ApiQuery({
    name: 'id',
    required: true,
    type: Number,
    description: 'Blog ID',
  })
  async GetSingleBlogsDetails(@Query() id: any) {
    return this.blogsService.GetSingleBlogsDetails(id);
  }

  @Post('/create')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create a new blog',
    required: true,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'string' },
        admin_id: { type: 'integer' },
        images: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createBlog(
    @Body() dto: CreateBlogDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.blogsService.createBlog(dto, image);
  }

  @Post('/update')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Update a blog',
    required: true,
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'string' },
        images: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async updateBlog(
    @Body() dto: UpdateBlogDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.blogsService.updateBlog(dto, image);
  }

  @Delete('/delete')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  async DeleteBlog(@Query() id: DeleteBlogsDto) {
    return this.blogsService.DeleteBlog(id);
  }


  @Get('/getMostVisitedBlogs')
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit the number of most visited blogs to return',
  })
  async GetMostVisitedBlogs(@Query('limit') limit: number = 10) {
    return this.blogsService.GetMostVisitedBlogs({ limit });
  }
}

