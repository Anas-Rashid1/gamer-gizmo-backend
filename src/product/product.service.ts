import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/product.dto';
import * as fs from 'fs/promises';

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
          queryData.condition.toLowerCase() === 'new' ? 'New' : 'Old';
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
      let data = await this.prismaService.product.findUnique({
        where: {
          id: parseInt(pid.id),
        },
      });
      if (!data) {
        throw new BadRequestException('No Product Found');
      }
      console.log(data, 'data');
      await this.prismaService.product.delete({
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
