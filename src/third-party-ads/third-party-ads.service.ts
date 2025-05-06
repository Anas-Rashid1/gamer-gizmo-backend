import { Injectable } from '@nestjs/common';
import { S3Service } from 'src/utils/s3.service'; // Adjust path as needed

@Injectable()
export class ThirdPartyAdsService {
  private s3Service: S3Service;

  constructor() {
    this.s3Service = new S3Service();
  }

  async uploadImage(file: Express.Multer.File): Promise<{ Key: string }> {
    return this.s3Service.upload_file(file);
  }

  async getImageUrl(key: string): Promise<string> {
    return this.s3Service.get_image_url(key);
  }
}
