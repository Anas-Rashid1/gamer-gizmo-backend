import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../utils/s3.service';

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async createOrUpdateOrDeleteAd(
    createOrUpdateAdDto: any & { s3_key?: string; s3_url?: string },
    file?: Express.Multer.File,
  ) {
    const ad_id = Number(createOrUpdateAdDto.ad_id);
    const page = createOrUpdateAdDto.page;
    const typeFromDto = createOrUpdateAdDto.type;
    let key: string | null = null;
    let type = typeFromDto || 'image';

    if (!ad_id || !page) {
      throw new Error('Both ad_id and page must be provided.');
    }

    if (file) {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      type = ['mp4', 'avi', 'mov'].includes(ext || '') ? 'video' : 'image';

      const uploadResult = await this.s3Service.upload_file(file);
      key = uploadResult.Key;

      const existingAd = await this.prisma.blog_ads.findUnique({
        where: {
          page_ad_id: {
            ad_id,
            page,
          },
        },
      });

      if (existingAd?.url) {
        await this.s3Service.deleteFileByKey(existingAd.url);
      }

      if (existingAd) {
        return this.prisma.blog_ads.update({
          where: {
            page_ad_id: {
              ad_id,
              page,
            },
          },
          data: {
            price: parseFloat(createOrUpdateAdDto.price),
            start_date: new Date(createOrUpdateAdDto.start_date),
            end_date: new Date(createOrUpdateAdDto.end_date),
            url: key,
            type: type,
          },
        });
      }

      return this.prisma.blog_ads.create({
        data: {
          ad_id,
          page,
          price: parseFloat(createOrUpdateAdDto.price),
          start_date: new Date(createOrUpdateAdDto.start_date),
          end_date: new Date(createOrUpdateAdDto.end_date),
          url: key,
          type: type,
        },
      });
    }

    return this.deleteAdByCompositeKey(page, ad_id);
  }

  async deleteAdByCompositeKey(page: string, ad_id: number) {
    const ad = await this.prisma.blog_ads.findUnique({
      where: {
        page_ad_id: {
          ad_id,
          page,
        },
      },
    });

    if (!ad) {
      throw new Error('Ad not found for deletion.');
    }

    if (ad.url) {
      await this.s3Service.deleteFileByKey(ad.url);
    }

    await this.prisma.blog_ads.delete({
      where: {
        page_ad_id: {
          ad_id,
          page,
        },
      },
    });

    return { message: 'Ad deleted successfully' };
  }

  async getAdsByPage(page: string) {
    const ads = await this.prisma.blog_ads.findMany({
      where: { page },
      orderBy: { start_date: 'desc' },
    });

    const adsWithUrls = await Promise.all(
      ads.map(async (ad) => {
        const signedUrl = ad.url ? await this.s3Service.get_image_url(ad.url) : null;
        return { ...ad, url: signedUrl };
      }),
    );

    return adsWithUrls;
  }
}


// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { S3Service } from '../utils/s3.service'; // adjust path if needed

// @Injectable()
// export class AdsService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly s3Service: S3Service,
//   ) {}

//   // async createOrUpdateOrDeleteAd(createOrUpdateAdDto: any, file?: Express.Multer.File) {
//     async createOrUpdateOrDeleteAd(
//       createOrUpdateAdDto: any & { s3_key?: string; s3_url?: string },
//       file?: Express.Multer.File,
//     )
//      {
//     const ad_id = Number(createOrUpdateAdDto.ad_id);
//     const page = createOrUpdateAdDto.page;
//     const typeFromDto = createOrUpdateAdDto.type;
//     let key: string | null = null;
//     let type = typeFromDto || 'image';

//     if (!ad_id || !page) {
//       throw new Error('Both ad_id and page must be provided.');
//     }

//     if (file) {
//       const ext = file.originalname.split('.').pop()?.toLowerCase();
//       type = ['mp4', 'avi', 'mov'].includes(ext || '') ? 'video' : 'image';

//       const uploadResult = await this.s3Service.upload_file(file, type === 'video' ? 'videos' : 'images');
//       key = uploadResult.Key;

//       const existingAd = await this.prisma.blog_ads.findUnique({
//         where: {
//           page_ad_id: {
//             ad_id,
//             page,
//           },
//         },
//       });

//       if (existingAd?.url) {
//         await this.s3Service.deleteFileByKey(existingAd.url);
//       }

//       if (existingAd) {
//         return this.prisma.blog_ads.update({
//           where: {
//             page_ad_id: {
//               ad_id,
//               page,
//             },
//           },
//           data: {
//             price: parseFloat(createOrUpdateAdDto.price),
//             start_date: new Date(createOrUpdateAdDto.start_date),
//             end_date: new Date(createOrUpdateAdDto.end_date),
//             url: key,
//             type: type,
//           },
//         });
//       }

//       return this.prisma.blog_ads.create({
//         data: {
//           ad_id,
//           page,
//           price: parseFloat(createOrUpdateAdDto.price),
//           start_date: new Date(createOrUpdateAdDto.start_date),
//           end_date: new Date(createOrUpdateAdDto.end_date),
//           url: key,
//           type: type,
//         },
//       });
//     }

//     return this.deleteAdByCompositeKey(page, ad_id);
//   }

//   async deleteAdByCompositeKey(page: string, ad_id: number) {
//     const ad = await this.prisma.blog_ads.findUnique({
//       where: {
//         page_ad_id: {
//           ad_id,
//           page,
//         },
//       },
//     });

//     if (!ad) {
//       throw new Error('Ad not found for deletion.');
//     }

//     if (ad.url) {
//       await this.s3Service.deleteFileByKey(ad.url);
//     }

//     await this.prisma.blog_ads.delete({
//       where: {
//         page_ad_id: {
//           ad_id,
//           page,
//         },
//       },
//     });

//     return { message: 'Ad deleted successfully' };
//   }

//   async getAdsByPage(page: string) {
//     const ads = await this.prisma.blog_ads.findMany({
//       where: { page },
//       orderBy: { start_date: 'desc' },
//     });

//     const adsWithUrls = await Promise.all(
//       ads.map(async (ad) => {
//         const signedUrl = ad.url ? await this.s3Service.get_image_url(ad.url) : null;
//         return { ...ad, url: signedUrl };
//       }),
//     );

//     return adsWithUrls;
//   }
// }

// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import * as fs from 'fs';
// import * as path from 'path';

// @Injectable()
// export class AdsService {
//   constructor(private readonly prisma: PrismaService) {}

//   async createOrUpdateOrDeleteAd(createOrUpdateAdDto: any, file?: Express.Multer.File) {
//     const ad_id = Number(createOrUpdateAdDto.ad_id);
//     const page = createOrUpdateAdDto.page;
//     const typeFromDto = createOrUpdateAdDto.type;
//     let fileUrl: string | null = null;
//     let type = typeFromDto || 'image';

//     if (!ad_id || !page) {
//       throw new Error('Both ad_id and page must be provided.');
//     }

//     if (file) {
//       const ext = path.extname(file.originalname).toLowerCase();
//       type = ['.mp4', '.avi', '.mov'].includes(ext) ? 'video' : 'image';

//       fileUrl = `/uploads/${type === 'video' ? 'videos' : 'images'}/${file.filename}`;

//       const existingAd = await this.prisma.blog_ads.findUnique({
//         where: {
//           page_ad_id: {
//             ad_id,
//             page,
//           },
//         },
//       });

//       if (existingAd) {
//         if (existingAd.url) {
//           const previousPath = path.join(__dirname, '../../', existingAd.url);
//           if (fs.existsSync(previousPath)) {
//             fs.unlinkSync(previousPath);
//           }
//         }

//         return this.prisma.blog_ads.update({
//           where: {
//             page_ad_id: {
//               ad_id,
//               page,
//             },
//           },
//           data: {
//             price: parseFloat(createOrUpdateAdDto.price),
//             start_date: new Date(createOrUpdateAdDto.start_date),
//             end_date: new Date(createOrUpdateAdDto.end_date),
//             url: fileUrl,
//             type: type,
//           },
//         });
//       }

//       return this.prisma.blog_ads.create({
//         data: {
//           ad_id,
//           page,
//           price: parseFloat(createOrUpdateAdDto.price),
//           start_date: new Date(createOrUpdateAdDto.start_date),
//           end_date: new Date(createOrUpdateAdDto.end_date),
//           url: fileUrl,
//           type: type,
//         },
//       });
//     }

//     return this.deleteAdByCompositeKey(page, ad_id);
//   }

//   async deleteAdByCompositeKey(page: string, ad_id: number) {
//     const ad = await this.prisma.blog_ads.findUnique({
//       where: {
//         page_ad_id: {
//           ad_id,
//           page,
//         },
//       },
//     });

//     if (!ad) {
//       throw new Error('Ad not found for deletion.');
//     }

//     if (ad.url) {
//       const filePath = path.join(__dirname, '../../', ad.url);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     }

//     await this.prisma.blog_ads.delete({
//       where: {
//         page_ad_id: {
//           ad_id,
//           page,
//         },
//       },
//     });

//     return { message: 'Ad deleted successfully' };
//   }

//   async getAdsByPage(page: string) {
//     return this.prisma.blog_ads.findMany({
//       where: {
//         page: page,
//       },
//       orderBy: {
//         start_date: 'desc',
//       },
//     });
//   }
// }


