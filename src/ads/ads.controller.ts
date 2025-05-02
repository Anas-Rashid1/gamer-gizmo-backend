import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdsService } from './ads.service';
import { CreateOrUpdateAdDto } from './dto/create-or-update-ad.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { S3Service } from 'src/utils/s3.service';
import * as path from 'path';

@ApiTags('ads')
@Controller('ads')
export class AdsController {
  constructor(
    private readonly adsService: AdsService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('create-or-update-or-delete')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  @ApiOperation({ summary: 'Create, update, or delete an ad' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ad_id: { type: 'integer' },
        page: { type: 'string' },
        price: { type: 'number' },
        start_date: { type: 'string', format: 'date-time' },
        end_date: { type: 'string', format: 'date-time' },
        type: { type: 'string', enum: ['image', 'video'] },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['ad_id', 'page'],
    },
    description:
      'If file is uploaded, then `price`, `start_date`, `end_date`, and `type` are also required for create/update. If no file is uploaded, it will delete the ad based on `ad_id` and `page`.',
  })
  async createOrUpdateAd(
    @Body() createOrUpdateAdDto: CreateOrUpdateAdDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adsService.createOrUpdateOrDeleteAd(createOrUpdateAdDto, file);
  }

  @Get('fetch')
  @ApiOperation({ summary: 'Fetch ads by page' })
  @ApiQuery({ name: 'page', required: true })
  async getAdsByPage(@Query('page') page: string) {
    if (!page) {
      throw new Error('Page query parameter is required');
    }
    return this.adsService.getAdsByPage(page);
  }
}


// import {
//   Controller,
//   Post,
//   Body,
//   UseInterceptors,
//   UploadedFile,
//   Get,
//   Query,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import * as path from 'path';
// import { AdsService } from './ads.service';
// import { CreateOrUpdateAdDto } from './dto/create-or-update-ad.dto';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiBody,
//   ApiConsumes,
//   ApiQuery,
// } from '@nestjs/swagger';

// @ApiTags('ads')
// @Controller('ads')
// export class AdsController {
//   constructor(private readonly adsService: AdsService) {}

//   @Post('create-or-update-or-delete')
//   @UseInterceptors(
//     FileInterceptor('file', {
//       storage: diskStorage({
//         destination: (req, file, cb) => {
//           const ext = path.extname(file.originalname).toLowerCase();
//           const isVideo = ['.mp4', '.avi', '.mov'].includes(ext);
  
//           const folder = isVideo ? 'videos' : 'images';
//           const destPath = path.join(__dirname, '../../uploads', folder);
  
//           // Create the folder if it doesn't exist
     
//           cb(null, destPath);
//         },
        
//         filename: (req, file, cb) => {
//           const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//           const ext = path.extname(file.originalname);
//           cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
//         },
//       }),
//     }),
//   )
//   @ApiOperation({ summary: 'Create, update, or delete an ad' })
//   @ApiConsumes('multipart/form-data')
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         ad_id: { type: 'integer' },
//         page: { type: 'string' },
//         price: { type: 'number' },
//         start_date: { type: 'string', format: 'date-time' },
//         end_date: { type: 'string', format: 'date-time' },
//         type: { type: 'string', enum: ['image', 'video'] },
//         file: {
//           type: 'string',
//           format: 'binary',
//         },
//       },
//       required: ['ad_id', 'page'], // ✅ Only these are always required
//     },
//     description:
//       'If file is uploaded, then `price`, `start_date`, `end_date`, and `type` are also required for create/update. If no file is uploaded, it will delete the ad based on `ad_id` and `page`.',
//   })
//   async createOrUpdateAd(
//     @Body() createOrUpdateAdDto: CreateOrUpdateAdDto,
//     @UploadedFile() image?: Express.Multer.File,
//   ) {
//     return this.adsService.createOrUpdateOrDeleteAd(createOrUpdateAdDto, image);
//   }

//   @Get('fetch')
//   @ApiOperation({ summary: 'Fetch ads by page' })
//   @ApiQuery({ name: 'page', required: true })
//   async getAdsByPage(@Query('page') page: string) {
//     if (!page) {
//       throw new Error('Page query parameter is required');
//     }
//     return this.adsService.getAdsByPage(page);
//   }
// }


