import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateOrDeleteAd(createOrUpdateAdDto: any, file?: Express.Multer.File) {
    const ad_id = Number(createOrUpdateAdDto.ad_id);
    const page = createOrUpdateAdDto.page;
    const typeFromDto = createOrUpdateAdDto.type;
    let fileUrl: string | null = null;
    let type = typeFromDto || 'image';

    if (!ad_id || !page) {
      throw new Error('Both ad_id and page must be provided.');
    }

    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      type = ['.mp4', '.avi', '.mov'].includes(ext) ? 'video' : 'image';

      fileUrl = `/uploads/${type === 'video' ? 'videos' : 'images'}/${file.filename}`;

      const existingAd = await this.prisma.blog_ads.findUnique({
        where: {
          page_ad_id: {
            ad_id,
            page,
          },
        },
      });

      if (existingAd) {
        if (existingAd.url) {
          const previousPath = path.join(__dirname, '../../', existingAd.url);
          if (fs.existsSync(previousPath)) {
            fs.unlinkSync(previousPath);
          }
        }

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
            url: fileUrl,
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
          url: fileUrl,
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
      const filePath = path.join(__dirname, '../../', ad.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
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
    return this.prisma.blog_ads.findMany({
      where: {
        page: page,
      },
      orderBy: {
        start_date: 'desc',
      },
    });
  }
}


// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import * as fs from 'fs';
// import * as path from 'path';

// @Injectable()
// export class AdsService {
//   constructor(private readonly prisma: PrismaService) {}

//   async createOrUpdateOrDeleteAd(createOrUpdateAdDto: any, image?: Express.Multer.File) {
//     const ad_id = Number(createOrUpdateAdDto.ad_id);
//     const page = createOrUpdateAdDto.page;
//     let imageUrl: string | null = null;

//     if (!ad_id || !page) {
//       throw new Error('Both ad_id and page must be provided.');
//     }

//     if (image) {
//       imageUrl = `/uploads/${image.filename}`;

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
//           const previousImagePath = path.join(__dirname, '../../uploads', path.basename(existingAd.url));
//           if (fs.existsSync(previousImagePath)) {
//             fs.unlinkSync(previousImagePath);
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
//             url: imageUrl,
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
//           url: imageUrl,
//         },
//       });
//     }

//     // No image, delete the ad if exists
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
//       const filename = path.basename(ad.url);
//       const filePath = path.join(__dirname, '../../uploads', filename);
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

