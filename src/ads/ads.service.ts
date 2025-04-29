import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateOrDeleteAd(
    createOrUpdateAdDto: any,
    image?: Express.Multer.File,
  ) {
    const ad_id = Number(createOrUpdateAdDto.ad_id);
    const page = createOrUpdateAdDto.page;
    let imageUrl: string | null = null;

    // Ensure both ad_id and page are provided
    if (!ad_id || !page) {
      throw new Error('Both ad_id and page must be provided.');
    }

    // Handle image update or creation
    if (image) {
      imageUrl = `/uploads/${image.filename}`;

      // Find existing ad by composite key (ad_id, page)
      const existingAd = await this.prisma.blog_ads.findUnique({
        where: {
          page_ad_id: {
            ad_id,
            page,
          },
        },
      });

      // If the ad exists, delete the old image and update the ad
      if (existingAd) {
        try {
          if (existingAd.url) {
            const previousImagePath = path.join(
              __dirname,
              '../../uploads',
              path.basename(existingAd.url),
            );
            if (fs.existsSync(previousImagePath)) {
              fs.unlinkSync(previousImagePath); // Delete the previous image
              console.log(`Deleted old image: ${previousImagePath}`);
            }
          }
        } catch (err) {
          console.error('Error deleting old image:', err);
          throw new Error('Failed to delete the old image.');
        }

        // Update the ad with the new image URL
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
            url: imageUrl,
          },
        });
      }

      // If the ad doesn't exist, create a new ad with the image
      return this.prisma.blog_ads.create({
        data: {
          ad_id,
          page,
          price: parseFloat(createOrUpdateAdDto.price),
          start_date: new Date(createOrUpdateAdDto.start_date),
          end_date: new Date(createOrUpdateAdDto.end_date),
          url: imageUrl,
        },
      });
    }

    // If no image is provided, proceed to delete the ad
    return this.deleteAdByCompositeKey(page, ad_id);
  }

  async deleteAdByCompositeKey(page: string, ad_id: number) {
    console.log('Trying to delete ad with:', { page, ad_id });

    const ad = await this.prisma.blog_ads.findUnique({
      where: {
        page_ad_id: {
          page,
          ad_id,
        },
      },
    });

    if (!ad) {
      console.error('No ad found for:', { page, ad_id });
      throw new Error('Ad not found for deletion.');
    }

    if (ad.url) {
      const filename = path.basename(ad.url);
      const filePath = path.join(__dirname, '../../uploads', filename);
      console.log('Checking for file:', filePath);

      if (fs.existsSync(filePath)) {
        console.log('Deleting file:', filePath);
        fs.unlinkSync(filePath);
      } else {
        console.warn('File not found, skipping file deletion:', filePath);
      }
    }

    await this.prisma.blog_ads.delete({
      where: {
        page_ad_id: {
          page,
          ad_id,
        },
      },
    });

    console.log('Ad deleted successfully for:', { page, ad_id });

    return { message: 'Ad deleted successfully' };
  }

  // Example method to get ads by page
  async getAdsByPage(page: string) {
    return this.prisma.blog_ads.findMany({
      where: {
        page: page, // Filtering by page parameter
      },
      orderBy: {
        start_date: 'desc', // Sort ads by start_date
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

//   // async createOrUpdateOrDeleteAd(createOrUpdateAdDto: any, image?: Express.Multer.File) {
//   //   let imageUrl: string | null = null;

//   //   if (image) {
//   //     // Save the image locally
//   //     const uploadsDir = path.join(__dirname, '../../uploads');
//   //     if (!fs.existsSync(uploadsDir)) {
//   //       fs.mkdirSync(uploadsDir, { recursive: true });
//   //     }

//   //     const filePath = path.join(uploadsDir, image.filename); // Using image.filename here
//   //     console.log('afsa')
//   //     fs.writeFileSync(filePath, image.buffer); // Writing the buffer to the file

//   //     imageUrl = `/uploads/${image.filename}`; // URL for accessing the image

//   //     // If ID provided, update
//   //     if (createOrUpdateAdDto.id) {
//   //       console.log('safsa')
//   //       const existingAd = await this.prisma.blog_ads.findUnique({
//   //         where: { id: createOrUpdateAdDto.id },
//   //       });

//   //       if (existingAd) {
//   //         return this.prisma.blog_ads.update({
//   //           where: { id: createOrUpdateAdDto.id },
//   //           data: {
//   //             ad_id: createOrUpdateAdDto.ad_id,
//   //             price: createOrUpdateAdDto.price,
//   //             start_date: createOrUpdateAdDto.start_date,
//   //             end_date: createOrUpdateAdDto.end_date,
//   //             page: createOrUpdateAdDto.page,
//   //             url: imageUrl,  // Store the image URL
//   //           },
//   //         });
//   //       }
//   //     }

//   //     // Create new ad
//   //     return this.prisma.blog_ads.create({
//   //       data: {
//   //         ad_id: createOrUpdateAdDto.ad_id,
//   //         price: createOrUpdateAdDto.price,
//   //         start_date: createOrUpdateAdDto.start_date,
//   //         end_date: createOrUpdateAdDto.end_date,
//   //         url: imageUrl,  // Store the image URL
//   //         page: createOrUpdateAdDto.page,
//   //       },
//   //     });
//   //   }

//   //   // If no image, try to delete ad
//   //   if (createOrUpdateAdDto.id) {
//   //     return this.deleteAdById(createOrUpdateAdDto.id);
//   //   }

//   //   throw new Error('No image uploaded or valid ID provided for deletion.');
//   // }

//   // Delete ad using primary ID
//   // async createOrUpdateOrDeleteAd(createOrUpdateAdDto: any, image?: Express.Multer.File) {
//   //   if (image) {
//   //     let imageUrl: string | null = null;

//   //     // Ensure the uploads directory exists
//   //     const uploadsDir = path.join(__dirname, '../../uploads');
//   //     if (!fs.existsSync(uploadsDir)) {
//   //       fs.mkdirSync(uploadsDir, { recursive: true });
//   //     }

//   //     // Check if image.buffer is available
//   //     if (!image.buffer) {
//   //       throw new Error('No image buffer available');
//   //     }

//   //     // Save the image locally
//   //     const filePath = path.join(uploadsDir, image.originalname);
//   //     fs.writeFileSync(filePath, image.buffer);  // Ensure this works with the buffer
//   //     imageUrl = `/uploads/${image.originalname}`;

//   //     // If ID provided, update
//   //     if (createOrUpdateAdDto.id) {
//   //       const existingAd = await this.prisma.blog_ads.findUnique({
//   //         where: { id: createOrUpdateAdDto.id },
//   //       });

//   //       if (existingAd) {
//   //         return this.prisma.blog_ads.update({
//   //           where: { id: createOrUpdateAdDto.id },
//   //           data: {
//   //             ad_id: createOrUpdateAdDto.ad_id,
//   //             price: createOrUpdateAdDto.price,
//   //             start_date: createOrUpdateAdDto.start_date,
//   //             end_date: createOrUpdateAdDto.end_date,
//   //             page: createOrUpdateAdDto.page,
//   //             url: imageUrl,
//   //           },
//   //         });
//   //       }
//   //     }

//   //     // Create new ad
//   //     return this.prisma.blog_ads.create({
//   //       data: {
//   //         ad_id: createOrUpdateAdDto.ad_id,
//   //         price: createOrUpdateAdDto.price,
//   //         start_date: createOrUpdateAdDto.start_date,
//   //         end_date: createOrUpdateAdDto.end_date,
//   //         url: imageUrl,
//   //         page: createOrUpdateAdDto.page,
//   //       },
//   //     });
//   //   }

//   //   // If no image, try to delete ad
//   //   if (createOrUpdateAdDto.id) {
//   //     return this.deleteAdById(createOrUpdateAdDto.id);
//   //   }

//   //   throw new Error('No image uploaded or valid ID provided for deletion.');
//   // }
//   async createOrUpdateOrDeleteAd(createOrUpdateAdDto: any, image?: Express.Multer.File) {
//     let imageUrl: string | null = null;
//     const id = Number(createOrUpdateAdDto.id);

//     if (image) {
//       imageUrl = `/uploads/${image.filename}`; // New image URL

//       if (id) {
//         const existingAd = await this.prisma.blog_ads.findUnique({
//           where: { id: id },
//         });

//         if (existingAd) {
//           // If previous image exists, delete it
//           if (existingAd.url) {
//             const previousImagePath = path.join(__dirname, '../../uploads', path.basename(existingAd.url));
//             if (fs.existsSync(previousImagePath)) {
//               fs.unlinkSync(previousImagePath); // Delete old image file
//             }
//           }

//           // Now update with new image
//           return this.prisma.blog_ads.update({
//             where: { id: id },
//             data: {
//               ad_id: Number(createOrUpdateAdDto.ad_id),
//               price: parseFloat(createOrUpdateAdDto.price),
//               start_date: createOrUpdateAdDto.start_date,
//               end_date: createOrUpdateAdDto.end_date,
//               page: createOrUpdateAdDto.page,
//               url: imageUrl,
//             },
//           });
//         }
//       }

//       // Create new ad if no existing ID
//       return this.prisma.blog_ads.create({
//         data: {
//           ad_id: Number(createOrUpdateAdDto.ad_id),
//           price: parseFloat(createOrUpdateAdDto.price),
//           start_date: createOrUpdateAdDto.start_date,
//           end_date: createOrUpdateAdDto.end_date,
//           url: imageUrl,
//           page: createOrUpdateAdDto.page,
//         },
//       });
//     }

//     // Delete if no image but ID is present
//     if (id) {
//       return this.deleteAdById(id);
//     }

//     throw new Error('No image uploaded or valid ID provided for deletion.');
//   }

//   async deleteAdById(id: number) {
//     const ad = await this.prisma.blog_ads.findUnique({
//       where: { id },
//     });

//     if (!ad) {
//       throw new Error('Ad not found');
//     }

//     // Delete image if it exists
//     if (ad.url) {
//       const filename = path.basename(ad.url);
//       const filePath = path.join(__dirname, '../../uploads', filename);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     }

//     await this.prisma.blog_ads.delete({
//       where: { id },
//     });

//     return { message: 'Ad deleted successfully' };
//   }
// }
