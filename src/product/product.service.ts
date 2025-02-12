import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto, InverProductStatusDto } from './dto/product.dto';
import * as fs from 'fs/promises';
import { CreateReviewDto } from './dto/review.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ProductService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {}
  extractTokenFromHeader(request: Request): string | undefined {
    // @ts-expect-error
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
  async GetAllProducts(queryData: any, user: any) {
    try {
      const token = this.extractTokenFromHeader(user);
      let payload = null;
      if (token) {
        try {
          payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET,
          });
        } catch (error) {
          console.warn('JWT Verification Failed:', error.message);
          // Continue execution even if JWT is invalid
          payload = null;
        }
      }
      const limit = 10;
      // Build the `where` parameters dynamically
      const WhereParameters: Record<string, any> = {};
      WhereParameters.is_published = true;
      // Standard filters for show_on_home, top_rated, etc.
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
        WhereParameters.condition = parseInt(queryData.condition, 10);
      }

      // Combine processor filter for both laptops and personal_computers with AND
      if (queryData.processor) {
        const processorValue = parseInt(queryData.processor, 10);
        WhereParameters.AND = WhereParameters.AND || []; // Initialize AND if not present
        WhereParameters.AND.push({
          OR: [
            {
              laptops: {
                some: {
                  processor: processorValue,
                },
              },
            },
            {
              personal_computers: {
                some: {
                  processor: processorValue,
                },
              },
            },
          ],
        });
      }

      // Apply RAM filter for both laptops and personal_computers
      if (queryData.ram) {
        const ramValue = parseInt(queryData.ram, 10);
        WhereParameters.AND = WhereParameters.AND || [];
        WhereParameters.AND.push({
          OR: [
            {
              laptops: {
                some: {
                  ram: ramValue,
                },
              },
            },
            {
              personal_computers: {
                some: {
                  ram: ramValue,
                },
              },
            },
          ],
        });
      }

      // Apply storage filter for both laptops and personal_computers
      if (queryData.storage) {
        const storageValue = parseInt(queryData.storage, 10);
        WhereParameters.AND = WhereParameters.AND || [];
        WhereParameters.AND.push({
          OR: [
            {
              laptops: {
                some: {
                  storage_type: storageValue,
                },
              },
            },
            {
              personal_computers: {
                some: {
                  storage_type: storageValue,
                },
              },
            },
          ],
        });
      }

      // Apply GPU filter for both laptops and personal_computers
      if (queryData.gpu) {
        const gpuValue = parseInt(queryData.gpu, 10);
        WhereParameters.AND = WhereParameters.AND || [];
        WhereParameters.AND.push({
          OR: [
            {
              laptops: {
                some: {
                  gpu: gpuValue,
                },
              },
            },
            {
              personal_computers: {
                some: {
                  gpu: gpuValue,
                },
              },
            },
          ],
        });
      }

      // Apply location filter
      if (queryData.location) {
        WhereParameters.location = parseInt(queryData.location, 10);
      }

      // Apply admin verification filter
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
          gaming_console: true,
          laptops: true,
          product_images: true,
          location_product_locationTolocation: true,
        },
        where: WhereParameters,
      };
      // Handle pagination
      if (queryData.pageNo) {
        queryOptions.skip = (parseInt(queryData.pageNo, 10) - 1) * limit;
        queryOptions.take = limit;
      }

      // Fetch data
      const data = await this.prismaService.product.findMany(queryOptions);
      console.log(data, 'WhereParameters');
      let dataToSend = [];
      dataToSend = await Promise.all(
        data.map(async (e) => ({
          name: e.name,
          id: e.id,
          description: e.description,
          price: e.price,
          // @ts-expect-error
          images: e.product_images,
          fav: payload
            ? (
                await this.prismaService.favourite_products.findMany({
                  where: {
                    user_id: parseInt(payload.id),
                    product_id: e.id,
                  },
                })
              ).length > 0
            : false,
        })),
      );
      console.log(dataToSend);
      return { data: dataToSend, message: 'success' };
    } catch (error) {
      // Throw a standardized internal server error
      throw new InternalServerErrorException(
        'Failed to fetch products',
        error.message,
      );
    }
  }

  async invertStatus(pid: InverProductStatusDto) {
    try {
      let data = await this.prismaService.product.findUnique({
        where: {
          id: parseInt(pid.product_id),
        },
      });
      if (!data) {
        throw new BadRequestException('No Product Found');
      }
      if (data.user_id != parseInt(pid.user_id)) {
        throw new BadRequestException('Not Allowed');
      }

      await this.prismaService.product.update({
        data: {
          is_published: !Boolean(data.is_published),
        },
        where: {
          id: parseInt(pid.product_id),
        },
      });

      return { data: data, message: 'successfully deleted' };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
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
      try {
        for (let i = 0; images.length > i; i++) {
          await fs.unlink(images[i].image_url);
        }
      } catch (err) {
        console.log('some');
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
  async GetProductById(pid: any, user: any) {
    try {
      const token = this.extractTokenFromHeader(user);
      let payload = null;
      if (token) {
        try {
          payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET,
          });
        } catch (error) {
          console.warn('JWT Verification Failed:', error.message);
          // Continue execution even if JWT is invalid
          payload = null;
        }
      }
      let data = await this.prismaService.product.findUnique({
        include: {
          brands: true,
          models: true,
          categories: true,
          condition_product_conditionTocondition: true,
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
          gaming_console: true,
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
          personal_computers: {
            include: {
              processors: true,
              ram_personal_computers_ramToram: true,
              storage_personal_computers_storageTostorage: true,
              storage_type_personal_computers_storage_typeTostorage_type: true,
              gpu_personal_computers_gpuTogpu: true,
              processor_variant_personal_computers_processor_variantToprocessor_variant:
                true,
            },
          },
          laptops: {
            include: {
              ram_laptops_ramToram: true,
              storage_laptops_storageTostorage: true,
              storage_type_laptops_storage_typeTostorage_type: true,
              gpu_laptops_gpuTogpu: true,
              processors: true,
              processor_variant_laptops_processor_variantToprocessor_variant:
                true,
            },
          },
          product_images: true,
          location_product_locationTolocation: true,
        },
        where: {
          id: parseInt(pid.id),
        },
      });

      if (!data) {
        return { data: null, message: 'Product not found' };
      }
      // @ts-expect-error
      data.fav = payload
        ? (
            await this.prismaService.favourite_products.findMany({
              where: {
                user_id: parseInt(payload.id),
                product_id: data.id,
              },
            })
          ).length > 0
        : false;

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
          condition: parseInt(productbody.condition),
          is_published: Boolean(productbody.is_published),
          is_verified_by_admin: false,
          verified_by: null,
          show_on_home: false,
          top_rated: false,
          location: parseInt(productbody.location),
          other_brand_name: productbody.otherBrandName,
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
            ram: parseInt(productbody.ram),
            processor: parseInt(productbody.processor),
            storage: parseInt(productbody.storage),
            storage_type: parseInt(productbody.storageType),
            gpu: parseInt(productbody.gpu),
            graphics: productbody.graphics,
            ports: productbody.ports,
            battery_life: productbody.battery_life,
            screen_size: productbody.screen_size,
            weight: productbody.weight,
            screen_resolution: productbody.screen_resolution,
            color: productbody.color,
            processor_variant: parseInt(productbody.processorVariant),
          },
        });
      } else if (parseInt(productbody.category_id) == 4) {
        await this.prismaService.gaming_console.create({
          data: {
            product_id: prod.id,
            accessories: productbody.accessories,
            warranty_status: productbody.warranty_status,
            color: productbody.color,
            battery_life: productbody.battery_life,
            connectivity: productbody.connectivity,
          },
        });
      } else if (parseInt(productbody.category_id) == 2) {
        await this.prismaService.personal_computers.create({
          data: {
            product_id: prod.id,
            ram: parseInt(productbody.ram),
            processor: parseInt(productbody.processor),
            processor_variant: parseInt(productbody.processorVariant),
            graphics: productbody.graphics,
            ports: productbody.ports,
            storage: parseInt(productbody.storage),
            storage_type: parseInt(productbody.storageType),
            gpu: parseInt(productbody.gpu),
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
      try {
        for (let i = 0; images.length > i; i++) {
          await fs.unlink(images[i].image_url);
        }
      } catch (err) {
        console.log('erre');
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

  async GetUserProducts(queryData: any) {
    try {
      const limit = 3;
      // Build the `where` parameters dynamically
      const WhereParameters: Record<string, any> = {
        user_id: parseInt(queryData.userId),
      };

      if (queryData.category_id) {
        WhereParameters.category_id = parseInt(queryData.category_id, 10);
      }

      if (queryData.brand_id) {
        WhereParameters.brand_id = parseInt(queryData.brand_id, 10);
      }
      if (queryData.condition) {
        WhereParameters.condition = parseInt(queryData.condition, 10);
      }
      if (queryData.location) {
        WhereParameters.location = parseInt(queryData.location, 10);
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
          gaming_console: true,
          laptops: true,
          product_images: true,
          location_product_locationTolocation: true,
        },
        where: WhereParameters,
      };

      // Handle pagination
      if (queryData.pageNo) {
        queryOptions.skip = (parseInt(queryData.pageNo, 10) - 1) * limit;
        queryOptions.take = limit;
      }

      // Fetch data
      const data = await this.prismaService.product.findMany(queryOptions);
      const count = await this.prismaService.product.count({
        where: {
          user_id: parseInt(queryData.userId),
        },
      });
      let dataToSend = [];
      dataToSend = await Promise.all(
        data.map(async (e) => ({
          name: e.name,
          id: e.id,
          active: e.is_published,
          description: e.description,
          // @ts-expect-error jhk
          category: e.categories.name,
          price: e.price,
          // @ts-expect-error
          images: e.product_images,
        })),
      );
      return { total: count, data: dataToSend, message: 'success' };
    } catch (error) {
      // Throw a standardized internal server error
      throw new InternalServerErrorException(
        'Failed to fetch products',
        error.message,
      );
    }
  }
}
