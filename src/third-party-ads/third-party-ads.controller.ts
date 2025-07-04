
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
