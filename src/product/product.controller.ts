// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Post,
//   Put,
//   Query,
//   Req,
//   UploadedFiles,
//   UseGuards,
//   UseInterceptors,
// } from '@nestjs/common';
// import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
// import {
//   CreateProductDto,
//   InverProductStatusDto,
//   UpdateProductDto,
// } from './dto/product.dto';
// import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { extname } from 'path';
// import { ProductService } from './product.service';
// import { CreateReviewDto } from './dto/review.dto';
// import { AuthGuard } from '@nestjs/passport';
// import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

// @ApiTags('Products')
// @Controller('/products')
// export class ProductsContoller {
//   constructor(private readonly productService: ProductService) {}
//   //   @ApiBearerAuth()ProductService
//   //   @UseGuards(AuthGuard)
//   @ApiQuery({
//     name: 'is_verified_by_admin',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'top_rated',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'condition',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'processor',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'ram',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'title',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'stoarge',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'gpu',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'location',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'price',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'brand_id',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'model_id',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'category_id',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'show_on_home',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'pageNo',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'is_store_product',
//     required: false, // Make category optional
//     type: String,
//   })
//   @Get('/getAll')
//   async getAllProducts(@Query() query: any, @Req() user: any) {
//     return this.productService.GetAllProducts(query, user);
//   }

//   @ApiQuery({
//     name: 'userId',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'active',
//     required: false, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'pageNo',
//     required: false, // Make category optional
//     type: String,
//   })
//   @Get('/getUserProducts')
//   async GetUserProducts(@Query() query: any) {
//     return this.productService.GetUserProducts(query);
//   }

//   @Get('/getProductById')
//   @ApiQuery({
//     name: 'id',
//     required: true, // Make category optional
//     type: String,
//   })
//   async GetProductById(@Query() id: string, @Req() user: any) {
//     return this.productService.GetProductById(id, user);
//   }

//   @Delete('/deleteProductById')
//   @ApiQuery({
//     name: 'user_id',
//     required: true, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'product_id',
//     required: true, // Make category optional
//     type: String,
//   })
//   async DeleteProductById(@Query() id: string) {
//     return this.productService.DeleteProductById(id);
//   }
//   @ApiBearerAuth()
//   @UseGuards(AdminAuthGuard)
//   @Delete('/deleteProductByIdFromAdmin')
//   @ApiQuery({
//     name: 'product_id',
//     required: true,
//     type: String,
//   })
//   async DeleteProductByIdFromAdmin(@Query() id: string) {
//     console.log(id);
//     return this.productService.DeleteProductByIdFromAdmin(id);
//   }

//   @Put('/invertStatus')
//   async invertStatus(@Body() productbody: InverProductStatusDto) {
//     return this.productService.invertStatus(productbody);
//   }
//   @Post('/createProduct')
//   @ApiConsumes('multipart/form-data')
//   // @ApiBearerAuth()
//   // @UseGuards(AuthGuard)
//   @UseInterceptors(
//     FilesInterceptor('images', 10, {
//       storage: diskStorage({
//         destination: function (req, file, cb) {
//           cb(null, './public/productImages');
//         },
//         filename: (req, file, cb) => {
//           const uniqueSuffix =
//             Date.now() + '-' + Math.round(Math.random() * 1e9);
//           const ext = extname(file.originalname); // Extract the file extension
//           const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
//           cb(null, fileName);
//         },
//       }),
//     }),
//   )
//   async CraeteProduct(
//     @Body() productbody: CreateProductDto,
//     @UploadedFiles() images: any,
//   ) {
//     return this.productService.CreateProduct(productbody, images);
//   }
//   @Post('/updateProduct')
//   @ApiConsumes('multipart/form-data')
//   // @ApiBearerAuth()
//   // @UseGuards(AuthGuard)
//   @UseInterceptors(
//     FilesInterceptor('images', 10, {
//       storage: diskStorage({
//         destination: function (req, file, cb) {
//           cb(null, './public/productImages');
//         },
//         filename: (req, file, cb) => {
//           const uniqueSuffix =
//             Date.now() + '-' + Math.round(Math.random() * 1e9);
//           const ext = extname(file.originalname); // Extract the file extension
//           const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
//           cb(null, fileName);
//         },
//       }),
//     }),
//   )
//   async UpdateProduct(@Body() productbody: any, @UploadedFiles() images: any) {
//     return this.productService.UpdateProduct(productbody, images);
//   }

//   @UseInterceptors(
//     FilesInterceptor('images', 10, {
//       storage: diskStorage({
//         destination: function (req, file, cb) {
//           cb(null, './public/reviewImages');
//         },
//         filename: (req, file, cb) => {
//           const uniqueSuffix =
//             Date.now() + '-' + Math.round(Math.random() * 1e9);
//           const ext = extname(file.originalname); // Extract the file extension
//           const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
//           cb(null, fileName);
//         },
//       }),
//     }),
//   )
//   @ApiConsumes('multipart/form-data')
//   @Post('/addReview')
//   async AddReview(
//     @Body() ReviewDto: CreateReviewDto,
//     @UploadedFiles() images: Express.Multer.File[],
//   ) {
//     return this.productService.AddReview(ReviewDto, images);
//   }

//   @Delete('/deleteReviewById')
//   // @ApiQuery({
//   //   name: 'user_id',
//   //   required: true, // Make category optional
//   //   type: String,
//   // })
//   @ApiQuery({
//     name: 'review_id',
//     required: true, // Make category optional
//     type: String,
//   })
//   async DeleteReviewById(@Query() data: any) {
//     return this.productService.DeleteReviewById(data);
//   }
// }


// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Post,
//   Put,
//   Query,
//   Req,
//   UploadedFiles,
//   UseGuards,
//   UseInterceptors,
// } from '@nestjs/common';
// import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags, ApiBody } from '@nestjs/swagger';
// import {
//   CreateProductDto,
//   InverProductStatusDto,
//   UpdateProductDto,
// } from './dto/product.dto';
// import { FilesInterceptor } from '@nestjs/platform-express';
// import { ProductService } from './product.service';
// import { CreateReviewDto } from './dto/review.dto';
// import { AuthGuard } from '@nestjs/passport';
// import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

// @ApiTags('Products')
// @Controller('/products')
// export class ProductsContoller {
//   constructor(private readonly productService: ProductService) {}

//   @ApiQuery({ name: 'is_verified_by_admin', required: false, type: String })
//   @ApiQuery({ name: 'top_rated', required: false, type: String })
//   @ApiQuery({ name: 'condition', required: false, type: String })
//   @ApiQuery({ name: 'processor', required: false, type: String })
//   @ApiQuery({ name: 'ram', required: false, type: String })
//   @ApiQuery({ name: 'title', required: false, type: String })
//   @ApiQuery({ name: 'stoarge', required: false, type: String })
//   @ApiQuery({ name: 'gpu', required: false, type: String })
//   @ApiQuery({ name: 'location', required: false, type: String })
//   @ApiQuery({ name: 'price', required: false, type: String })
//   @ApiQuery({ name: 'brand_id', required: false, type: String })
//   @ApiQuery({ name: 'model_id', required: false, type: String })
//   @ApiQuery({ name: 'category_id', required: false, type: String })
//   @ApiQuery({ name: 'show_on_home', required: false, type: String })
//   @ApiQuery({ name: 'pageNo', required: false, type: String })
//   @ApiQuery({ name: 'is_store_product', required: false, type: String })
//   @Get('/getAll')
//   async getAllProducts(@Query() query: any, @Req() user: any) {
//     return this.productService.GetAllProducts(query, user);
//   }

//   @ApiQuery({ name: 'userId', required: false, type: String })
//   @ApiQuery({ name: 'active', required: false, type: String })
//   @ApiQuery({ name: 'pageNo', required: false, type: String })
//   @Get('/getUserProducts')
//   async GetUserProducts(@Query() query: any) {
//     return this.productService.GetUserProducts(query);
//   }

//   @Get('/getProductById')
//   @ApiQuery({ name: 'id', required: true, type: String })
//   async GetProductById(@Query() id: string, @Req() user: any) {
//     return this.productService.GetProductById(id, user);
//   }

//   @Delete('/deleteProductById')
//   @ApiQuery({ name: 'user_id', required: true, type: String })
//   @ApiQuery({ name: 'product_id', required: true, type: String })
//   async DeleteProductById(@Query() id: string) {
//     return this.productService.DeleteProductById(id);
//   }

//   @ApiBearerAuth()
//   @UseGuards(AdminAuthGuard)
//   @Delete('/deleteProductByIdFromAdmin')
//   @ApiQuery({ name: 'product_id', required: true, type: String })
//   async DeleteProductByIdFromAdmin(@Query() id: string) {
//     return this.productService.DeleteProductByIdFromAdmin(id);
//   }

//   @Put('/invertStatus')
//   async invertStatus(@Body() productbody: InverProductStatusDto) {
//     return this.productService.invertStatus(productbody);
//   }

//   @Post('/createProduct')
//   @ApiConsumes('multipart/form-data')
//   @UseInterceptors(FilesInterceptor('images', 10))
//   @ApiBody({
//     description: 'Create a new product with multiple images',
//     required: true,
//     schema: {
//       type: 'object',
//       properties: {
//         name: { type: 'string' },
//         description: { type: 'string' },
//         price: { type: 'string' },
//         stock: { type: 'string' },
//         is_store_product: { type: 'string' },
//         brand_id: { type: 'string' },
//         model_id: { type: 'string' },
//         category_id: { type: 'string' },
//         condition: { type: 'string' },
//         is_published: { type: 'string' },
//         location: { type: 'string' },
//         otherBrandName: { type: 'string' },
//         user_id: { type: 'string' },
//         ram: { type: 'string' },
//         processor: { type: 'string' },
//         storage: { type: 'string' },
//         storageType: { type: 'string' },
//         gpu: { type: 'string' },
//         graphics: { type: 'string' },
//         ports: { type: 'string' },
//         battery_life: { type: 'string' },
//         screen_size: { type: 'string' },
//         weight: { type: 'string' },
//         screen_resolution: { type: 'string' },
//         color: { type: 'string' },
//         processorVariant: { type: 'string' },
//         accessories: { type: 'string' },
//         warranty_status: { type: 'string' },
//         connectivity: { type: 'string' },
//         component_type: { type: 'string' },
//         text: { type: 'string' },
//         images: {
//           type: 'array',
//           items: { type: 'string', format: 'binary' },
//         },
//       },
//     },
//   })
//   async CraeteProduct(
//     @Body() productbody: CreateProductDto,
//     @UploadedFiles() images: Express.Multer.File[],
//   ) {
//     return this.productService.CreateProduct(productbody, images);
//   }

//   @Post('/updateProduct')
//   @ApiConsumes('multipart/form-data')
//   @UseInterceptors(FilesInterceptor('images', 10))
//   @ApiBody({
//     description: 'Update a product with multiple images',
//     required: true,
//     schema: {
//       type: 'object',
//       properties: {
//         prod_id: { type: 'string' },
//         name: { type: 'string' },
//         description: { type: 'string' },
//         price: { type: 'string' },
//         stock: { type: 'string' },
//         is_store_product: { type: 'string' },
//         brand_id: { type: 'string' },
//         model_id: { type: 'string' },
//         category_id: { type: 'string' },
//         condition: { type: 'string' },
//         is_published: { type: 'string' },
//         location: { type: 'string' },
//         otherBrandName: { type: 'string' },
//         laptops: {
//           type: 'array',
//           items: {
//             type: 'object',
//             properties: {
//               ram: { type: 'string' },
//               processor: { type: 'string' },
//               storage: { type: 'string' },
//               storage_type: { type: 'string' },
//               gpu: { type: 'string' },
//               graphics: { type: 'string' },
//               ports: { type: 'string' },
//               battery_life: { type: 'string' },
//               screen_size: { type: 'string' },
//               weight: { type: 'string' },
//               screen_resolution: { type: 'string' },
//               color: { type: 'string' },
//               processor_variant: { type: 'string' },
//             },
//           },
//         },
//         gaming_console: {
//           type: 'array',
//           items: {
//             type: 'object',
//             properties: {
//               accessories: { type: 'string' },
//               warranty_status: { type: 'string' },
//               color: { type: 'string' },
//               battery_life: { type: 'string' },
//               connectivity: { type: 'string' },
//             },
//           },
//         },
//         personal_computers: {
//           type: 'array',
//           items: {
//             type: 'object',
//             properties: {
//               ram: { type: 'string' },
//               processor: { type: 'string' },
//               processor_variant: { type: 'string' },
//               graphics: { type: 'string' },
//               ports: { type: 'string' },
//               storage: { type: 'string' },
//               storage_type: { type: 'string' },
//               gpu: { type: 'string' },
//             },
//           },
//         },
//         components: {
//           type: 'array',
//           items: {
//             type: 'object',
//             properties: {
//               component_type: { type: 'string' },
//               text: { type: 'string' },
//             },
//           },
//         },
//         images: {
//           type: 'array',
//           items: { type: 'string', format: 'binary' },
//         },
//       },
//     },
//   })
//   async UpdateProduct(
//     @Body() productbody: UpdateProductDto,
//     @UploadedFiles() images: Express.Multer.File[],
//   ) {
//     return this.productService.UpdateProduct(productbody, images);
//   }

//   @Post('/addReview')
//   @ApiConsumes('multipart/form-data')
//   @UseInterceptors(FilesInterceptor('images', 10))
//   @ApiBody({
//     description: 'Add a review with multiple images',
//     required: true,
//     schema: {
//       type: 'object',
//       properties: {
//         ratings: { type: 'string' },
//         user_id: { type: 'string' },
//         product_id: { type: 'string' },
//         comments: { type: 'string' },
//         images: {
//           type: 'array',
//           items: { type: 'string', format: 'binary' },
//         },
//       },
//     },
//   })
//   async AddReview(
//     @Body() ReviewDto: CreateReviewDto,
//     @UploadedFiles() images: Express.Multer.File[],
//   ) {
//     return this.productService.AddReview(ReviewDto, images);
//   }

//   @Delete('/deleteReviewById')
//   @ApiQuery({ name: 'review_id', required: true, type: String })
//   async DeleteReviewById(@Query() data: any) {
//     return this.productService.DeleteReviewById(data);
//   }
// }

import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags, ApiBody } from '@nestjs/swagger';
import {
  CreateProductDto,
  InverProductStatusDto,
  UpdateProductDto,
} from './dto/product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateReviewDto } from './dto/review.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

@ApiTags('Products')
@Controller('/products')
export class ProductsContoller {
  constructor(private readonly productService: ProductService) {}

  @ApiQuery({ name: 'is_verified_by_admin', required: false, type: String })
  @ApiQuery({ name: 'top_rated', required: false, type: String })
  @ApiQuery({ name: 'condition', required: false, type: String })
  @ApiQuery({ name: 'processor', required: false, type: String })
  @ApiQuery({ name: 'ram', required: false, type: String })
  @ApiQuery({ name: 'title', required: false, type: String })
  @ApiQuery({ name: 'stoarge', required: false, type: String })
  @ApiQuery({ name: 'gpu', required: false, type: String })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'price', required: false, type: String })
  @ApiQuery({ name: 'brand_id', required: false, type: String })
  @ApiQuery({ name: 'model_id', required: false, type: String })
  @ApiQuery({ name: 'category_id', required: false, type: String })
  @ApiQuery({ name: 'show_on_home', required: false, type: String })
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'is_store_product', required: false, type: String })
  @Get('/getAll')
  async getAllProducts(@Query() query: any, @Req() user: any) {
    return this.productService.GetAllProducts(query, user);
  }

  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: String })
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @Get('/getUserProducts')
  async GetUserProducts(@Query() query: any) {
    return this.productService.GetUserProducts(query);
  }

  @Get('/getProductById')
  @ApiQuery({ name: 'id', required: true, type: String })
  async GetProductById(@Query() id: string, @Req() user: any) {
    return this.productService.GetProductById(id, user);
  }

  @Delete('/deleteProductById')
  @ApiQuery({ name: 'user_id', required: true, type: String })
  @ApiQuery({ name: 'product_id', required: true, type: String })
  async DeleteProductById(@Query() id: string) {
    return this.productService.DeleteProductById(id);
  }

  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Delete('/deleteProductByIdFromAdmin')
  @ApiQuery({ name: 'product_id', required: true, type: String })
  async DeleteProductByIdFromAdmin(@Query() id: string) {
    return this.productService.DeleteProductByIdFromAdmin(id);
  }

  @Put('/invertStatus')
  async invertStatus(@Body() productbody: InverProductStatusDto) {
    return this.productService.invertStatus(productbody);
  }

  @Post('/createProduct')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBody({
    description: 'Create a new product with multiple images',
    required: true,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'string' },
        stock: { type: 'string' },
        is_store_product: { type: 'string' },
        brand_id: { type: 'string' },
        model_id: { type: 'string' },
        category_id: { type: 'string' },
        condition: { type: 'string' },
        is_published: { type: 'string' },
        location: { type: 'string' },
        otherBrandName: { type: 'string' },
        user_id: { type: 'string' },
        ram: { type: 'string' },
        processor: { type: 'string' },
        storage: { type: 'string' },
        storageType: { type: 'string' },
        gpu: { type: 'string' },
        graphics: { type: 'string' },
        ports: { type: 'string' },
        battery_life: { type: 'string' },
        screen_size: { type: 'string' },
        weight: { type: 'string' },
        screen_resolution: { type: 'string' },
        color: { type: 'string' },
        processorVariant: { type: 'string' },
        accessories: { type: 'string' },
        warranty_status: { type: 'string' },
        connectivity: { type: 'string' },
        component_type: { type: 'string' },
        text: { type: 'string' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async CraeteProduct(
    @Body() productbody: CreateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productService.CreateProduct(productbody, images);
  }

  @Post('/updateProduct')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBody({
    description: 'Update a product with multiple images',
    required: true,
    schema: {
      type: 'object',
      properties: {
        prod_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'string' },
        stock: { type: 'string' },
        is_store_product: { type: 'string' },
        brand_id: { type: 'string' },
        model_id: { type: 'string' },
        category_id: { type: 'string' },
        condition: { type: 'string' },
        is_published: { type: 'string' },
        location: { type: 'string' },
        otherBrandName: { type: 'string' },
        laptops: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ram: { type: 'string' },
              processor: { type: 'string' },
              storage: { type: 'string' },
              storage_type: { type: 'string' },
              gpu: { type: 'string' },
              graphics: { type: 'string' },
              ports: { type: 'string' },
              battery_life: { type: 'string' },
              screen_size: { type: 'string' },
              weight: { type: 'string' },
              screen_resolution: { type: 'string' },
              color: { type: 'string' },
              processor_variant: { type: 'string' },
            },
          },
        },
        gaming_console: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accessories: { type: 'string' },
              warranty_status: { type: 'string' },
              color: { type: 'string' },
              battery_life: { type: 'string' },
              connectivity: { type: 'string' },
            },
          },
        },
        personal_computers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ram: { type: 'string' },
              processor: { type: 'string' },
              processor_variant: { type: 'string' },
              graphics: { type: 'string' },
              ports: { type: 'string' },
              storage: { type: 'string' },
              storage_type: { type: 'string' },
              gpu: { type: 'string' },
            },
          },
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component_type: { type: 'string' },
              text: { type: 'string' },
            },
          },
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async UpdateProduct(
    @Body() productbody: UpdateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productService.UpdateProduct(productbody, images);
  }

  @Post('/addReview')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBody({
    description: 'Add a review with multiple images',
    required: true,
    schema: {
      type: 'object',
      properties: {
        ratings: { type: 'string' },
        user_id: { type: 'string' },
        product_id: { type: 'string' },
        comments: { type: 'string' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async AddReview(
    @Body() ReviewDto: CreateReviewDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productService.AddReview(ReviewDto, images);
  }

  @Delete('/deleteReviewById')
  @ApiQuery({ name: 'review_id', required: true, type: String })
  async DeleteReviewById(@Query() data: any) {
    return this.productService.DeleteReviewById(data);
  }

  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'pageNo', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @Get('/search')
  async searchProducts(@Query() query: { query: string; pageNo?: string; limit?: string }) {
    return this.productService.searchProducts(query);
  }

  @Delete('/deleteProductImage')
@ApiQuery({ 
  name: 'image_ids', 
  required: true, 
  type: [String], 
  description: 'Single image ID or array of image IDs' 
})
async DeleteProductImage(@Query('image_ids') imageIds: string | string[]) {
  return this.productService.DeleteProductImage(imageIds);
}

  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Put('/setFeatured')
  @ApiQuery({ name: 'product_id', required: true, type: String })
  async SetFeatured(@Query('product_id') productId: string) {
    return this.productService.SetFeatured(productId);
  }

  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Put('/setNonFeatured')
  @ApiQuery({ name: 'product_id', required: true, type: String })
  async SetNonFeatured(@Query('product_id') productId: string) {
    return this.productService.SetNonFeatured(productId);
  }
  // New endpoint for store products with orders
  @Get('store-products-with-orders')
  async getStoreProductsWithOrders(): Promise<{ id: number; name: string }[]> {
    return this.productService.getStoreProductsWithOrders();
  }
}