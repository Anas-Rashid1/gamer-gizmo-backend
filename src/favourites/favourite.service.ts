import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToFavouriteDto } from './dto/addToFav.dto';

@Injectable()
export class AddToFavouriteService {
  constructor(private prismaService: PrismaService) {}
  async GetAllFavourites(queryData: any) {
    try {
      const limit = 10;

      const queryOptions: any = {
        include: {
          product: {
            include: {
              brands: true,
              models: true,
              categories: true,
              components: {
                include: {
                  component_type_components_component_typeTocomponent_type:
                    true, // Correct relation
                },
              },
              personal_computers: true,
              laptops: true,
              product_images: true,
              users: {
                select: {
                  username: true,
                  profile: true,
                  created_at: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone: true,
                  gender: true,
                },
              },
            },
          },
        },
        where: {
          user_id: parseInt(queryData.userId),
        },
      };

      if (queryData.pageNo) {
        queryOptions.skip = (parseInt(queryData.pageNo, 10) - 1) * limit;
        queryOptions.take = limit;
      }

      // Fetch data
      const data =
        await this.prismaService.favourite_products.findMany(queryOptions);

      return { data, message: 'success' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch products',
        error.message,
      );
    }
  }

  async AddToFavourite(data: AddToFavouriteDto) {
    try {
      await this.prismaService.favourite_products.create({
        data: {
          user_id: parseInt(data.userId),
          product_id: parseInt(data.productId),
        },
      });

      return { data: data, message: 'Successfully Added' };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }
  async RemoveFavourite(data: AddToFavouriteDto) {
    try {
      await this.prismaService.favourite_products.deleteMany({
        where: {
          user_id: parseInt(data.userId),
          product_id: parseInt(data.productId),
        },
      });

      return { data: data, message: 'Successfully Deleted' };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }
}
