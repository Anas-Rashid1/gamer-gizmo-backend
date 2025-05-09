// import {
//   BadRequestException,
//   Injectable,
//   InternalServerErrorException,
// } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateBrandsDto } from './dto/createbrands.dto';
// import { GetBrandsDto } from './dto/getbrands.dto';
// import { DeleteBrandsDto } from './dto/deletebrands.dto';
// import * as fs from 'fs/promises';
// import * as path from 'path';

// @Injectable()
// export class BrandsService {
//   constructor(private prisma: PrismaService) {}
//   async GetAllBrands({ category, pageNo }: GetBrandsDto) {
//     try {
//       const limit = 10;

//       const whereCondition = category
//         ? { category_id: parseInt(category) }
//         : {}; // Apply category filter if provided
//       const queryOptions: any = {
//         where: whereCondition,
//       };

//       if (pageNo) {
//         queryOptions.skip = (parseInt(pageNo) - 1) * limit; // Calculate the offset
//         queryOptions.take = limit; // Limit the number of records
//       }

//       const brands = await this.prisma.brands.findMany(queryOptions);
//       return { message: 'Success', data: brands };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async DeleteBrand({ id }: DeleteBrandsDto) {
//     try {
//       const brands = await this.prisma.brands.findUnique({
//         where: {
//           id: parseInt(id),
//         },
//       });
//       // Check if the brand or its logo is missing
//       if (!brands) {
//         throw new BadRequestException(`Brand with id ${id} does not exist.`);
//       }
//       if (!brands.logo) {
//         throw new BadRequestException('No logo associated with this brand.');
//       }
//       if (brands.logo) {
//         try {
//           await fs.unlink(brands.logo.slice(1)); // Remove first character if needed
//         } catch (unlinkError) {
//           console.warn(
//             `Failed to delete logo file: ${brands.logo}`,
//             unlinkError,
//           );
//           // Continue execution even if unlink fails
//         }
//       }

//       // Delete the brand from the database
//       await this.prisma.brands.delete({
//         where: {
//           id: parseInt(id),
//         },
//       });

//       return { message: 'Successfully Deleted' };
//     } catch (e) {
//       console.error('Error deleting brand:', e);
//       throw new InternalServerErrorException(
//         e.message || 'Failed to delete the brand.',
//       );
//     }
//   }

//   async createBrand(data: CreateBrandsDto, logo: any) {
//     try {
//       const brands = await this.prisma.brands.create({
//         data: {
//           name: data.name,
//           category_id: parseInt(data.category_id),
//           logo: `/public/brandsLogo/${logo.filename}`,
//           status: Boolean(data.status),
//         },
//       });
//       return { message: 'Successfully Created' };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
// }
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandsDto } from './dto/createbrands.dto';
import { GetBrandsDto } from './dto/getbrands.dto';
import { DeleteBrandsDto } from './dto/deletebrands.dto';
import { S3Service } from 'src/utils/s3.service';

@Injectable()
export class BrandsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async GetAllBrands({ category, pageNo }: GetBrandsDto) {
    try {
      const limit = 10;
      const whereCondition = category
        ? { category_id: parseInt(category) }
        : {};
      const queryOptions: any = { where: whereCondition };

      if (pageNo) {
        queryOptions.skip = (parseInt(pageNo) - 1) * limit;
        queryOptions.take = limit;
      }

      const brands = await this.prisma.brands.findMany(queryOptions);

      // Generate signed URLs for each brand logo
      const brandsWithSignedUrls = await Promise.all(
        brands.map(async (brand) => {
          const logoUrl = brand.logo
            ? await this.s3Service.get_image_url(brand.logo)
            : null;
          return { ...brand, logo: logoUrl };
        }),
      );

      return { message: 'Success', data: brandsWithSignedUrls };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async DeleteBrand({ id }: DeleteBrandsDto) {
    try {
      const brand = await this.prisma.brands.findUnique({
        where: { id: parseInt(id) },
      });

      if (!brand) {
        throw new BadRequestException(`Brand with id ${id} does not exist.`);
      }

      if (brand.logo) {
        try {
          await this.s3Service.deleteFileByKey(brand.logo);
        } catch (e) {
          console.warn(`Failed to delete logo from S3: ${brand.logo}`, e);
        }
      }

      await this.prisma.brands.delete({ where: { id: parseInt(id) } });

      return { message: 'Successfully Deleted' };
    } catch (e) {
      console.error('Error deleting brand:', e);
      throw new InternalServerErrorException(
        e.message || 'Failed to delete the brand.',
      );
    }
  }

  async createBrand(data: CreateBrandsDto, logo: Express.Multer.File) {
    try {
      const { Key } = await this.s3Service.upload_file(logo);

      const newBrand = await this.prisma.brands.create({
        data: {
          name: data.name,
          category_id: parseInt(data.category_id),
          logo: Key, // Save only S3 key
          status: Boolean(data.status),
        },
      });

      return { message: 'Successfully Created', data: newBrand };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
