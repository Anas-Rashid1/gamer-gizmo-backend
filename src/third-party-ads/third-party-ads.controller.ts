// import {
//   Controller,
//   Get,
//   Param,
//   Post,
//   UploadedFile,
//   UseInterceptors,
// } from '@nestjs/common';
// import { ThirdPartyAdsService } from './third-party-ads.service';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { extname } from 'path';
// @Controller('third-party-ads')
// export class ThirdPartyAdsController {
//   constructor(private readonly thirdPartyAdsService: ThirdPartyAdsService) {}
//   @Post('upload')
//   @UseInterceptors(
//     FileInterceptor('image', {
//       storage: diskStorage({
//         destination: './upload',
//         filename: (req, file, callback) => {
//           const uniqueSuffix =
//             Date.now() + '-' + Math.round(Math.random() * 1e9);
//           const ext = extname(file.originalname);
//           callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
//         },
//       }),
//     }),
//   )
//   uploadFile(@UploadedFile() file: Express.Multer.File) {
//     return {
//       message: 'Image uploaded successfully',
//       filePath: file.path,
//     };
//   }
//   @Get('image')
//   getImage(@Param('filename') filename: string) {
//     return {
//       message: 'success',
//     };
//   }
// }
import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ThirdPartyAdsService } from './third-party-ads.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('third-party-ads')
export class ThirdPartyAdsController {
  constructor(private readonly thirdPartyAdsService: ThirdPartyAdsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const { Key } = await this.thirdPartyAdsService.uploadImage(file);
    return {
      message: 'Image uploaded successfully',
      key: Key,
    };
  }

  @Get('image/:key')
  async getImage(@Param('key') key: string) {
    const imageUrl = await this.thirdPartyAdsService.getImageUrl(key);
    return {
      message: 'success',
      url: imageUrl,
    };
  }
}
