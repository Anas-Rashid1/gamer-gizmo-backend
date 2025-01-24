import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/cart.dto';
import * as fs from 'fs/promises';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class CartService {
  constructor(private prismaService: PrismaService) {}
  async getUserCarts(queryData: any) {
    try {
      const limit = 10;

      // Pagination setup
      const queryOptions: any = {
        include: {
          cart_items: true,
          // products: {
          //   include: {
          //     brands: true,
          //     models: true,
          //     categories: true,
          //     components: {
          //       include: {
          //         component_type_components_component_typeTocomponent_type:
          //           true, // Correct relation
          //       },
          //     },
          //     personal_computers: true,
          //     laptops: true,
          //     product_images: true,
          //   },
          // },
        },
        where: {
          user_id: parseInt(queryData.user_id),
        },
      };

      if (queryData.pageNo) {
        queryOptions.skip = (parseInt(queryData.pageNo, 10) - 1) * limit;
        queryOptions.take = limit;
      }

      const data = await this.prismaService.cart.findMany(queryOptions);

      return { data, message: 'success' };
    } catch (error) {
      // Throw a standardized internal server error
      throw new InternalServerErrorException(
        'Failed to fetch products',
        error.message,
      );
    }
  }

  async DeleteProductById(pid: any) {
    try {
      // let data = await this.prismaService.product.findUnique({
      //   where: {
      //     id: parseInt(pid.product_id),
      //   },
      // });
      // if (!data) {
      //   throw new BadRequestException('No Product Found');
      // }
      // if (data.user_id != pid.user_id) {
      //   throw new BadRequestException('Not Allowed');
      // }
      // let images = await this.prismaService.product_images.findMany({
      //   where: {
      //     product_id: parseInt(pid.product_id),
      //   },
      // });
      // for (let i = 0; images.length > i; i++) {
      //   await fs.unlink(images[i].image_url);
      // }
      // await this.prismaService.product_images.deleteMany({
      //   where: {
      //     product_id: parseInt(pid.product_id),
      //   },
      // });
      // await this.prismaService.laptops.deleteMany({
      //   where: {
      //     product_id: parseInt(pid.product_id),
      //   },
      // });
      // await this.prismaService.personal_computers.deleteMany({
      //   where: {
      //     product_id: parseInt(pid.product_id),
      //   },
      // });
      // await this.prismaService.components.deleteMany({
      //   where: {
      //     product_id: parseInt(pid.product_id),
      //   },
      // });
      // let rev = await this.prismaService.review.findMany({
      //   where: {
      //     product_id: parseInt(pid.product_id),
      //   },
      // });
      // for (let i = 0; rev.length > i; i++) {
      //   let rev_images = await this.prismaService.review_images.findMany({
      //     where: {
      //       review_id: rev[i].id,
      //     },
      //   });
      //   for (let i = 0; rev_images.length > i; i++) {
      //     await fs.unlink(rev_images[i].image_url);
      //   }
      //   await this.prismaService.review_images.deleteMany({
      //     where: {
      //       review_id: rev[i].id,
      //     },
      //   });
      // }
      // await this.prismaService.review.deleteMany({
      //   where: {
      //     product_id: parseInt(pid.product_id),
      //   },
      // });
      // await this.prismaService.product.delete({
      //   where: {
      //     id: parseInt(pid.product_id),
      //   },
      // });
      // console.log(images, 'data');

      return { data: 'data', message: 'successfully deleted' };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }

  async AddItemToCart(productbody: CreateProductDto, images) {
    try {
      return { message: 'success' };
    } catch (e) {
      console.log(e);
      for (let i = 0; images.length > i; i++) {
        await fs.unlink(images[i].path);
      }
      throw new InternalServerErrorException(e);
    }
  }
}
