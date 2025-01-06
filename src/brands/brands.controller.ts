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
import { BrandsService } from './brands.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';
import { CreateBrandsDto } from './dto/createbrands.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GetBrandsDto } from './dto/getbrands.dto';
import { DeleteBrandsDto } from './dto/deletebrands.dto';

@ApiTags('Products Brands')
@Controller('/brands')
export class BrandsContoller {
  constructor(private readonly brandsService: BrandsService) {}
  //   @ApiBearerAuth()
  //   @UseGuards(AuthGuard)
  @Get('/getAll')
  @ApiQuery({
    name: 'category',
    required: true, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'pageNo',
    required: false, // Make pageNo optional
    type: Number,
    description:
      'Page number for pagination (if not provided, all brands will be returned)',
  })
  async GetAllBrands(@Query() { category, pageNo = null }: GetBrandsDto) {
    return this.brandsService.GetAllBrands({ category, pageNo });
  }
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: function (req, file, cb) {
          cb(null, './public/brandsLogo');
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create a new brand with logo',
    required: true,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Brand name' },
        status: { type: 'boolean', description: 'Publish Status' },
        category_id: {
          type: 'integer',
          description: 'Category ID to associate',
        },
        logo: {
          type: 'string',
          format: 'binary', // Mark this field as a binary file for Swagger
          description: 'Brand logo file (image)',
        },
      },
    },
  })
  @Post('/create')
  async createBrand(
    @Body() CreateCategoriesDto: CreateBrandsDto,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return this.brandsService.createBrand(CreateCategoriesDto, logo);
  }
  @Delete('/delete')
  async deleteBrand(@Query() id: DeleteBrandsDto) {
    return this.brandsService.DeleteBrand(id);
  }
}
