import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/product.dto';
import * as fs from 'fs/promises';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ProductService {
  constructor(private prismaService: PrismaService) {}
  async GetAllProducts(queryData: any) {
    try {
      const limit = 10;

      // Build the `where` parameters dynamically
      const WhereParameters: Record<string, any> = {};
      if (queryData.show_on_home) {
        WhereParameters.show_on_home = Boolean(queryData.show_on_home);
      }
      if (queryData.top_rated) {
        WhereParameters.top_rated = Boolean(queryData.top_rated);
      }
      if (queryData.category_id) {
        WhereParameters.category_id = parseInt(queryData.category_id, 10);
      }
      if (queryData.model_id) {
        WhereParameters.model_id = parseInt(queryData.model_id, 10);
      }
      if (queryData.brand_id) {
        WhereParameters.brand_id = parseInt(queryData.brand_id, 10);
      }
      if (queryData.condition) {
        WhereParameters.condition =
          queryData.condition.toLowerCase() === 'new' ? 'new' : 'used';
      }
      if (queryData.is_verified_by_admin) {
        WhereParameters.is_verified_by_admin = Boolean(
          queryData.is_verified_by_admin,
        );
      }

      // Pagination setup
      const queryOptions: any = {
        include: {
          brands: true,
          models: true,
          categories: true,
          components: {
            include: {
              component_type_components_component_typeTocomponent_type: true, // Correct relation
            },
          },
          personal_computers: true,
          laptops: true,
          product_images: true,
        },
        where: WhereParameters,
      };

      if (queryData.pageNo) {
        queryOptions.skip = (parseInt(queryData.pageNo, 10) - 1) * limit;
        queryOptions.take = limit;
      }

      // Fetch data
      const data = await this.prismaService.product.findMany(queryOptions);
      console.log();
      let dataToSend = [];
      data.map((e) => {
        dataToSend.push({
          name: e.name,
          id: e.id,
          description: e.description,
          price: e.price,
          images: e[0].product_images,
        });
      });
      return { data: dataToSend, message: 'success' };
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
      let data = await this.prismaService.product.findUnique({
        where: {
          id: parseInt(pid.product_id),
        },
      });
      if (!data) {
        throw new BadRequestException('No Product Found');
      }
      if (data.user_id != pid.user_id) {
        throw new BadRequestException('Not Allowed');
      }
      let images = await this.prismaService.product_images.findMany({
        where: {
          product_id: parseInt(pid.product_id),
        },
      });
      for (let i = 0; images.length > i; i++) {
        await fs.unlink(images[i].image_url);
      }
      await this.prismaService.product_images.deleteMany({
        where: {
          product_id: parseInt(pid.product_id),
        },
      });
      await this.prismaService.laptops.deleteMany({
        where: {
          product_id: parseInt(pid.product_id),
        },
      });
      await this.prismaService.personal_computers.deleteMany({
        where: {
          product_id: parseInt(pid.product_id),
        },
      });
      await this.prismaService.components.deleteMany({
        where: {
          product_id: parseInt(pid.product_id),
        },
      });
      let rev = await this.prismaService.store_product_review.findMany({
        where: {
          product_id: parseInt(pid.product_id),
        },
      });
      for (let i = 0; rev.length > i; i++) {
        let rev_images =
          await this.prismaService.store_product_review_images.findMany({
            where: {
              review_id: rev[i].id,
            },
          });
        for (let i = 0; rev_images.length > i; i++) {
          await fs.unlink(rev_images[i].image_url);
        }
        await this.prismaService.store_product_review_images.deleteMany({
          where: {
            review_id: rev[i].id,
          },
        });
      }
      await this.prismaService.store_product_review.deleteMany({
        where: {
          product_id: parseInt(pid.product_id),
        },
      });
      await this.prismaService.product.delete({
        where: {
          id: parseInt(pid.product_id),
        },
      });
      console.log(images, 'data');

      return { data: data, message: 'successfully deleted' };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }
  async GetProductById(pid: any) {
    try {
      let data = await this.prismaService.product.findUnique({
        include: {
          brands: true,
          models: true,
          categories: true,
          // components: true,
          components: {
            include: {
              component_type_components_component_typeTocomponent_type: true, // Correct nested relation
            },
          },
          store_product_review: {
            include: {
              store_product_review_images: true, // Correct nested relation
            },
          },
          personal_computers: true,
          laptops: true,
          product_images: true,
        },
        where: {
          id: parseInt(pid.id),
        },
      });

      return { data: data, message: 'success' };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }
  async CreateProduct(productbody: CreateProductDto, images) {
    try {
      let prod = await this.prismaService.product.create({
        data: {
          name: productbody.name,
          user_id: parseInt(productbody.user_id),
          description: productbody.description,
          price: productbody.price,
          stock: productbody.stock,
          brand_id: productbody?.brand_id
            ? parseInt(productbody?.brand_id)
            : null,
          model_id: productbody.model_id
            ? parseInt(productbody.model_id)
            : null,
          category_id: parseInt(productbody.category_id),
          condition: productbody.condition,
          is_published: Boolean(productbody.is_published),
          is_verified_by_admin: false,
          verified_by: null,
          show_on_home: false,
          top_rated: false,
        },
      });

      for (let i = 0; images.length > i; i++) {
        await this.prismaService.product_images.create({
          data: {
            product_id: prod.id,
            image_url: images[i].path,
            created_at: new Date(),
          },
        });
      }
      if (parseInt(productbody.category_id) == 1) {
        await this.prismaService.laptops.create({
          data: {
            product_id: prod.id,
            ram: productbody.ram,
            processor: productbody.processor,
            storage: productbody.storage,
            graphics: productbody.graphics,
            ports: productbody.ports,
            battery_life: productbody.battery_life,
            screen_size: productbody.screen_size,
            weight: productbody.weight,
            screen_resolution: productbody.screen_resolution,
            os: productbody.os,
            color: productbody.color,
            processortype: productbody.processorType,
          },
        });
      } else if (parseInt(productbody.category_id) == 2) {
        await this.prismaService.personal_computers.create({
          data: {
            product_id: prod.id,
            ram: productbody.ram,
            processor: productbody.processor,
            processortype: productbody.processorType,
            storage: productbody.storage,
            graphics: productbody.graphics,
            ports: productbody.ports,
            os: productbody.os,
          },
        });
      } else if (parseInt(productbody.category_id) == 3) {
        await this.prismaService.components.create({
          data: {
            product_id: prod.id,
            component_type: parseInt(productbody.component_type),
            text: productbody.text,
          },
        });
      }
      await this.prismaService.users.update({
        data: { is_seller: true },
        where: { id: parseInt(productbody.user_id) },
      });
      return { message: 'success' };
    } catch (e) {
      console.log(e);
      for (let i = 0; images.length > i; i++) {
        await fs.unlink(images[i].path);
      }
      throw new InternalServerErrorException(e);
    }
  }

  async AddReview(productbody: CreateReviewDto, images) {
    try {
      let pro = await this.prismaService.product.findUnique({
        where: {
          id: parseInt(productbody.product_id),
        },
      });
      if (!pro) {
        throw new BadRequestException('No Product Found');
      }
      if (!pro.is_verified_by_admin) {
        throw new BadRequestException('No Cant Review this product');
      }
      let rev = await this.prismaService.store_product_review.create({
        data: {
          ratings: parseInt(productbody.ratings),
          user_id: parseInt(productbody.user_id),
          product_id: parseInt(productbody.product_id),
          comments: productbody.comments,
        },
      });

      for (let i = 0; images.length > i; i++) {
        await this.prismaService.store_product_review_images.create({
          data: {
            review_id: rev.id,
            image_url: images[i].path,
            created_at: new Date(),
          },
        });
      }

      return { message: 'success added review' };
    } catch (e) {
      console.log(e);
      for (let i = 0; images.length > i; i++) {
        await fs.unlink(images[i].path);
      }
      throw new InternalServerErrorException(e);
    }
  }

  async DeleteReviewById(data: any) {
    try {
      let rev = await this.prismaService.store_product_review.findUnique({
        where: {
          id: parseInt(data.review_id),
        },
      });
      if (!rev) {
        throw new BadRequestException('No Product Found');
      }
      if (rev.user_id != data.user_id) {
        throw new BadRequestException('Not Allowed');
      }
      let images =
        await this.prismaService.store_product_review_images.findMany({
          where: {
            review_id: parseInt(data.review_id),
          },
        });
      for (let i = 0; images.length > i; i++) {
        await fs.unlink(images[i].image_url);
      }
      await this.prismaService.store_product_review_images.deleteMany({
        where: {
          review_id: parseInt(data.review_id),
        },
      });

      await this.prismaService.store_product_review.delete({
        where: {
          id: parseInt(data.review_id),
        },
      });

      return { data: data, message: 'successfully deleted' };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }
}
