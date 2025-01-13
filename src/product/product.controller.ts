import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';
import { CreateProductDto } from './dto/product.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from './product.service';

@ApiTags('Products')
@Controller('/products')
export class ProductsContoller {
  constructor(private readonly productService: ProductService) {}
  //   @ApiBearerAuth()ProductService
  //   @UseGuards(AuthGuard)
  @ApiQuery({
    name: 'is_verified_by_admin',
    required: false, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'top_rated',
    required: false, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'condition',
    required: false, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'brand_id',
    required: false, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'model_id',
    required: false, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'category_id',
    required: false, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'show_on_home',
    required: false, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'pageNo',
    required: false, // Make category optional
    type: String,
  })
  @Get('/getAll')
  async getAllProducts(@Query() query: any) {
    return this.productService.GetAllProducts(query);
  }

  @Get('/getProductById')
  @ApiQuery({
    name: 'id',
    required: true, // Make category optional
    type: String,
  })
  async GetProductById(@Query() id: string) {
    return this.productService.GetProductById(id);
  }

  @Delete('/deleteProductById')
  @ApiQuery({
    name: 'id',
    required: true, // Make category optional
    type: String,
  })
  async DeleteProductById(@Query() id: string) {
    return this.productService.DeleteProductById(id);
  }
  // @ApiBearerAuth()
  // @UseGuards(AuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: function (req, file, cb) {
          cb(null, './public/productImages');
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
  @Post('/createProduct')
  async CraeteProduct(
    @Body() productbody: CreateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productService.CreateProduct(productbody, images);
  }
}
