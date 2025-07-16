import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateProductDto,
  InverProductStatusDto,
  UpdateProductDto,
} from './dto/product.dto';
import { CreateReviewDto } from './dto/review.dto';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from 'src/utils/s3.service';
import { Prisma } from '@prisma/client';

// Define the type for product with included relations for GetAllProducts and GetUserProducts
interface ProductWithRelations {
  id: number;
  name: string;
  user_id?: number | null;
  description: string;
  price: string;
  stock: string;
  brand_id?: number | null;
  model_id?: number | null;
  category_id: number;
  is_published?: boolean;
  is_verified_by_admin?: boolean;
  verified_by?: number | null;
  created_at?: Date;
  show_on_home?: boolean;
  top_rated?: boolean;
  location?: number | null;
  condition?: number | null;
  other_brand_name?: string | null;
  is_store_product?: boolean;
  admin_id?: number | null;
  is_featured: boolean;
  feature_start_date?: Date | null;
  feature_end_date?: Date | null;
  admin?: {
    id: number;
    email: string;
    password: string;
    name: string;
    created_at: Date;
    type: string;
  } | null;
  brands?: {
    id: number;
    name: string;
    category_id: number;
    logo: string | null;
    status: boolean;
  } | null;
  models?: {
    id: number;
    name: string;
    brand_id: number;
    status: boolean;
  } | null;
  categories?: { id: number; name: string };
  components?: {
    id: number;
    product_id: number;
    text: string | null;
    component_type: number;
    component_type_components_component_typeTocomponent_type: {
      id: number;
      name: string;
    };
  }[];
  personal_computers?: {
    id: number;
    product_id: number;
    graphics: string | null;
    ports: string | null;
    processor: number | null;
    processor_variant: number | null;
    storage: number | null;
    storage_type: number | null;
    ram: number | null;
    gpu: number | null;
  }[];
  gaming_console?: {
    id: number;
    product_id: number;
    color: string | null;
    accessories: string | null;
    connectivity: string | null;
    warranty_status: string | null;
    battery_life: string | null;
  }[];
  laptops?: {
    id: number;
    product_id: number;
    graphics: string | null;
    ports: string | null;
    battery_life: string | null;
    screen_size: string | null;
    weight: string | null;
    screen_resolution: string | null;
    color: string | null;
    processor: number | null;
    processor_variant: number | null;
    storage: number | null;
    storage_type: number | null;
    ram: number | null;
    gpu: number | null;
  }[];
  users?: {
    id: number;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  product_images?: {
    id: number;
    product_id: number;
    image_url: string;
    created_at: Date;
  }[];
  location_product_locationTolocation?: { id: number; name: string } | null;
  admin_product_admin_idToadmin?: {
    id: number;
    email: string;
    password: string;
    name: string;
    created_at: Date;
    type: string;
  } | null;
}

// Define the type for product with included relations for SearchProductByTitle
type SearchProductWithRelations = Prisma.productGetPayload<{
  include: {
    brands: true;
    models: true;
    categories: true;
    condition_product_conditionTocondition: true;
    components: {
      include: {
        component_type_components_component_typeTocomponent_type: true;
      };
    };
    product_reviews: {
      include: {
        users: {
          select: {
            username: true;
            profile: true;
            created_at: true;
            first_name: true;
            last_name: true;
            email: true;
            phone: true;
            gender: true;
          };
        };
        store_product_review_images: true;
      };
      orderBy: { created_at: 'desc' };
    };
    gaming_console: true;
    users: {
      select: {
        username: true;
        profile: true;
        created_at: true;
        first_name: true;
        last_name: true;
        email: true;
        phone: true;
        gender: true;
      };
    };
    personal_computers: {
      include: {
        processors: true;
        ram_personal_computers_ramToram: true;
        storage_personal_computers_storageTostorage: true;
        storage_type_personal_computers_storage_typeTostorage_type: true;
        gpu_personal_computers_gpuTogpu: true;
        processor_variant_personal_computers_processor_variantToprocessor_variant: true;
      };
    };
    laptops: {
      include: {
        ram_laptops_ramToram: true;
        storage_laptops_storageTostorage: true;
        storage_type_laptops_storage_typeTostorage_type: true;
        gpu_laptops_gpuTogpu: true;
        processors: true;
        processor_variant_laptops_processor_variantToprocessor_variant: true;
      };
    };
    product_images: true;
    location_product_locationTolocation: true;
  };
}>;

@Injectable()
export class ProductService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private s3Service: S3Service,
  ) {}

  extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  // async GetAllProducts(queryData: any, user: any) {
  //   try {
  //     const token = this.extractTokenFromHeader(user);
  //     let payload = null;
  //     if (token) {
  //       try {
  //         payload = await this.jwtService.verifyAsync(token, {
  //           secret: process.env.JWT_SECRET,
  //         });
  //       } catch (error) {
  //         console.warn('JWT Verification Failed:', error.message);
  //         payload = null;
  //       }
  //     }
  //     const limit = 10;

  //     // Build the `where` parameters dynamically
  //     const WhereParameters: Record<string, any> = {};
  //     WhereParameters.is_store_product = false;
  //     WhereParameters.is_published = true;
  //     if (queryData.title) {
  //       WhereParameters.name = {
  //         contains: queryData.title,
  //         mode: 'insensitive',
  //       };
  //     }
  //     if (queryData.show_on_home) {
  //       WhereParameters.show_on_home = Boolean(queryData.show_on_home);
  //     }
  //     if (queryData.is_store_product && queryData.is_store_product == 'true') {
  //       WhereParameters.is_store_product = Boolean(queryData.is_store_product);
  //     }
  //     if (queryData.top_rated) {
  //       WhereParameters.top_rated = Boolean(queryData.top_rated);
  //     }
  //     if (queryData.category_id) {
  //       WhereParameters.category_id = parseInt(queryData.category_id, 10);
  //     }
  //     if (queryData.model_id) {
  //       WhereParameters.model_id = parseInt(queryData.model_id, 10);
  //     }
  //     if (queryData.brand_id) {
  //       WhereParameters.brand_id = parseInt(queryData.brand_id, 10);
  //     }
  //     if (queryData.condition) {
  //       const conditionValue = parseInt(queryData.condition, 10);
  //       if (conditionValue === 2) {
  //         WhereParameters.condition = { in: [2, 3, 4] };
  //       } else {
  //         WhereParameters.condition = conditionValue;
  //       }
  //     }
  //     if (queryData.processor) {
  //       const processorValue = parseInt(queryData.processor, 10);
  //       WhereParameters.AND = WhereParameters.AND || [];
  //       WhereParameters.AND.push({
  //         OR: [
  //           { laptops: { some: { processor: processorValue } } },
  //           { personal_computers: { some: { processor: processorValue } } },
  //         ],
  //       });
  //     }
  //     if (queryData.ram) {
  //       const ramValue = parseInt(queryData.ram, 10);
  //       WhereParameters.AND = WhereParameters.AND || [];
  //       WhereParameters.AND.push({
  //         OR: [
  //           { laptops: { some: { ram: ramValue } } },
  //           { personal_computers: { some: { ram: ramValue } } },
  //         ],
  //       });
  //     }
  //     if (queryData.storage) {
  //       const storageValue = parseInt(queryData.storage, 10);
  //       WhereParameters.AND = WhereParameters.AND || [];
  //       WhereParameters.AND.push({
  //         OR: [
  //           { laptops: { some: { storage_type: storageValue } } },
  //           { personal_computers: { some: { storage_type: storageValue } } },
  //         ],
  //       });
  //     }
  //     if (queryData.gpu) {
  //       const gpuValue = parseInt(queryData.gpu, 10);
  //       WhereParameters.AND = WhereParameters.AND || [];
  //       WhereParameters.AND.push({
  //         OR: [
  //           { laptops: { some: { gpu: gpuValue } } },
  //           { personal_computers: { some: { gpu: gpuValue } } },
  //         ],
  //       });
  //     }
  //     if (queryData.location) {
  //       WhereParameters.location = parseInt(queryData.location, 10);
  //     }
  //     if (queryData.is_verified_by_admin) {
  //       WhereParameters.is_verified_by_admin = Boolean(
  //         queryData.is_verified_by_admin,
  //       );
  //     }

  //     const selectFilters = {
  //       brands: true,
  //       models: true,
  //       categories: true,
  //       components: {
  //         include: {
  //           component_type_components_component_typeTocomponent_type: true,
  //         },
  //       },
  //       personal_computers: true,
  //       gaming_console: true,
  //       laptops: true,
  //       admin: true,
  //       admin_product_admin_idToadmin: true,
  //       users: true,
  //       product_images: true,
  //       location_product_locationTolocation: true,
  //     };

  //     const totalCount = await this.prismaService.product.count({
  //       where: WhereParameters,
  //     });

  //     const queryOptions: any = {
  //       include: selectFilters,
  //       where: WhereParameters,
  //     };
  //     if (queryData.pageNo) {
  //       queryOptions.skip = (parseInt(queryData.pageNo, 10) - 1) * limit;
  //       queryOptions.take = limit;
  //     }

  //     const data: ProductWithRelations[] =
  //       await this.prismaService.product.findMany(queryOptions);

  //     const today = new Date();
  //     const featured: any[] = [];
  //     const nonFeatured: any[] = [];
  //     const expiredFeaturedProductIds: number[] = [];

  //     for (const e of data) {
  //       if (e.is_featured) {
  //         if (e.feature_start_date && e.feature_end_date) {
  //           const start = new Date(e.feature_start_date);
  //           const end = new Date(e.feature_end_date);
  //           if (today < start || today > end) {
  //             expiredFeaturedProductIds.push(e.id);
  //             e.is_featured = false;
  //             e.feature_start_date = null;
  //             e.feature_end_date = null;
  //           }
  //         } else {
  //           expiredFeaturedProductIds.push(e.id);
  //           e.is_featured = false;
  //         }
  //       }

  //       // Generate signed URLs for product images
  //       const imageUrls = e.product_images.length
  //         ? await this.s3Service.get_image_urls(
  //             e.product_images.map((img) => img.image_url),
  //           )
  //         : [];
  //       const imagesWithUrls = e.product_images.map((img, index) => ({
  //         ...img,
  //         image_url: imageUrls[index],
  //       }));

  //       const productInfo = {
  //         is_featured: e.is_featured,
  //         feature_start_date: e.feature_start_date,
  //         feature_end_date: e.feature_end_date,
  //         created_at: e.created_at,
  //         created_by: e.is_store_product
  //           ? 'GamerGizmo Store'
  //           : e.users?.first_name + ' ' + e.users?.last_name,
  //         name: e.name,
  //         category: e.categories?.name,
  //         id: e.id,
  //         description: e.description,
  //         price: e.price,
  //         images: imagesWithUrls,
  //         fav: payload
  //           ? (
  //               await this.prismaService.favourite_products.findMany({
  //                 where: {
  //                   user_id: parseInt(payload.id),
  //                   product_id: e.id,
  //                 },
  //               })
  //             ).length > 0
  //           : false,
  //       };
  //       if (e.is_featured) {
  //         featured.push(productInfo);
  //       } else {
  //         nonFeatured.push(productInfo);
  //       }
  //     }

  //     if (expiredFeaturedProductIds.length > 0) {
  //       await this.prismaService.product.updateMany({
  //         where: { id: { in: expiredFeaturedProductIds } },
  //         data: {
  //           is_featured: false,
  //           feature_start_date: null,
  //           feature_end_date: null,
  //         },
  //       });
  //     }

  //     const finalData = [...featured, ...nonFeatured];
  //     return { data: finalData, totalCount, message: 'success' };
  //   } catch (error) {
  //     throw new InternalServerErrorException(
  //       'Failed to fetch products',
  //       error.message,
  //     );
  //   }
  // }
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
          payload = null;
        }
      }

      const limit = queryData.limit ? parseInt(queryData.limit, 10) : 5;

      // Build the `where` parameters dynamically
      const WhereParameters: Record<string, any> = {};
      WhereParameters.is_store_product = false;
      WhereParameters.is_published = true;
      if (queryData.title) {
        WhereParameters.name = {
          contains: queryData.title,
          mode: 'insensitive',
        };
      }
      if (queryData.show_on_home) {
        WhereParameters.show_on_home = Boolean(queryData.show_on_home);
      }
      if (queryData.is_store_product && queryData.is_store_product == 'true') {
        WhereParameters.is_store_product = Boolean(queryData.is_store_product);
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
        const conditionValue = parseInt(queryData.condition, 10);
        if (conditionValue === 2) {
          WhereParameters.condition = { in: [2, 3, 4] };
        } else {
          WhereParameters.condition = conditionValue;
        }
      }
      if (queryData.processor) {
        const processorValue = parseInt(queryData.processor, 10);
        WhereParameters.AND = WhereParameters.AND || [];
        WhereParameters.AND.push({
          OR: [
            { laptops: { some: { processor: processorValue } } },
            { personal_computers: { some: { processor: processorValue } } },
          ],
        });
      }
      if (queryData.ram) {
        const ramValue = parseInt(queryData.ram, 10);
        WhereParameters.AND = WhereParameters.AND || [];
        WhereParameters.AND.push({
          OR: [
            { laptops: { some: { ram: ramValue } } },
            { personal_computers: { some: { ram: ramValue } } },
          ],
        });
      }
      if (queryData.storage) {
        const storageValue = parseInt(queryData.storage, 10);
        WhereParameters.AND = WhereParameters.AND || [];
        WhereParameters.AND.push({
          OR: [
            { laptops: { some: { storage_type: storageValue } } },
            { personal_computers: { some: { storage_type: storageValue } } },
          ],
        });
      }
      if (queryData.gpu) {
        const gpuValue = parseInt(queryData.gpu, 10);
        WhereParameters.AND = WhereParameters.AND || [];
        WhereParameters.AND.push({
          OR: [
            { laptops: { some: { gpu: gpuValue } } },
            { personal_computers: { some: { gpu: gpuValue } } },
          ],
        });
      }
      if (queryData.location) {
        WhereParameters.location = parseInt(queryData.location, 10);
      }
      if (queryData.is_verified_by_admin) {
        WhereParameters.is_verified_by_admin = Boolean(
          queryData.is_verified_by_admin,
        );
      }

      const selectFilters = {
        brands: true,
        models: true,
        categories: true,
        components: {
          include: {
            component_type_components_component_typeTocomponent_type: true,
          },
        },
        personal_computers: true,
        gaming_console: true,
        laptops: true,
        admin: true,
        admin_product_admin_idToadmin: true,
        users: true,
        product_images: true,
        location_product_locationTolocation: true,
      };

      const totalCount = await this.prismaService.product.count({
        where: WhereParameters,
      });

      const queryOptions: any = {
        include: selectFilters,
        where: WhereParameters,
        orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }],
      };
      if (queryData.pageNo) {
        queryOptions.skip = (parseInt(queryData.pageNo, 10) - 1) * limit;
        queryOptions.take = limit;
      } else {
        queryOptions.take = limit;
      }

      const data: ProductWithRelations[] =
        await this.prismaService.product.findMany(queryOptions);

      const featured: any[] = [];
      const nonFeatured: any[] = [];

      for (const e of data) {
        // Generate signed URLs for product images
        const imageUrls = e.product_images.length
          ? await this.s3Service.get_image_urls(
              e.product_images.map((img) => img.image_url),
            )
          : [];
        const imagesWithUrls = e.product_images.map((img, index) => ({
          ...img,
          image_url: imageUrls[index],
        }));

        const productInfo = {
          is_featured: e.is_featured,
          feature_start_date: e.feature_start_date,
          feature_end_date: e.feature_end_date,
          created_at: e.created_at,
          created_by: e.is_store_product
            ? 'GamerGizmo Store'
            : e.users?.first_name + ' ' + e.users?.last_name,
          name: e.name,
          category: e.categories?.name,
          id: e.id,
          description: e.description,
          price: e.price,
          images: imagesWithUrls,
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
        };
        if (e.is_featured) {
          featured.push(productInfo);
        } else {
          nonFeatured.push(productInfo);
        }
      }

      const finalData = [...featured, ...nonFeatured];
      return { data: finalData, totalCount, message: 'success' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch products',
        error.message,
      );
    }
  }
  async invertStatus(pid: InverProductStatusDto) {
    try {
      const data = await this.prismaService.product.findUnique({
        where: { id: parseInt(pid.product_id) },
      });
      if (!data) {
        throw new BadRequestException('No Product Found');
      }
      if (data.user_id != parseInt(pid.user_id)) {
        throw new BadRequestException('Not Allowed');
      }

      await this.prismaService.product.update({
        data: { is_published: !Boolean(data.is_published) },
        where: { id: parseInt(pid.product_id) },
      });

      return { data, message: 'successfully updated' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async DeleteProductById(pid: any) {
    try {
      const data = await this.prismaService.product.findUnique({
        where: { id: parseInt(pid.product_id) },
      });
      if (!data) {
        throw new BadRequestException('No Product Found');
      }
      if (data.user_id != parseInt(pid.user_id)) {
        throw new BadRequestException('Not Allowed');
      }

      // Delete product images from S3
      const images = await this.prismaService.product_images.findMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      for (const img of images) {
        await this.s3Service.deleteFileByKey(img.image_url);
      }

      // Delete review images from S3
      const reviews = await this.prismaService.product_reviews.findMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      for (const rev of reviews) {
        const revImages =
          await this.prismaService.store_product_review_images.findMany({
            where: { review_id: rev.id },
          });
        for (const revImg of revImages) {
          await this.s3Service.deleteFileByKey(revImg.image_url);
        }
        await this.prismaService.store_product_review_images.deleteMany({
          where: { review_id: rev.id },
        });
      }

      // Delete related records
      await this.prismaService.product_images.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.laptops.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.personal_computers.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.components.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.product_reviews.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.product.delete({
        where: { id: parseInt(pid.product_id) },
      });

      return { data, message: 'successfully deleted' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async DeleteProductByIdFromAdmin(pid: any) {
    try {
      const data = await this.prismaService.product.findUnique({
        where: { id: parseInt(pid.product_id) },
      });
      if (!data) {
        throw new BadRequestException('No Product Found');
      }

      // Delete product images from S3
      const images = await this.prismaService.product_images.findMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      for (const img of images) {
        await this.s3Service.deleteFileByKey(img.image_url);
      }

      // Delete review images from S3
      const reviews = await this.prismaService.product_reviews.findMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      for (const rev of reviews) {
        const revImages =
          await this.prismaService.store_product_review_images.findMany({
            where: { review_id: rev.id },
          });
        for (const revImg of revImages) {
          await this.s3Service.deleteFileByKey(revImg.image_url);
        }
        await this.prismaService.store_product_review_images.deleteMany({
          where: { review_id: rev.id },
        });
      }

      // Delete related records
      await this.prismaService.product_images.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.laptops.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.personal_computers.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.components.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.product_reviews.deleteMany({
        where: { product_id: parseInt(pid.product_id) },
      });
      await this.prismaService.product.delete({
        where: { id: parseInt(pid.product_id) },
      });

      return { data, message: 'successfully deleted' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  // async GetProductById(pid: any, user: any) {
  //   try {
  //     const token = this.extractTokenFromHeader(user);
  //     let payload = null;
  //     if (token) {
  //       try {
  //         payload = await this.jwtService.verifyAsync(token, {
  //           secret: process.env.JWT_SECRET,
  //         });
  //       } catch (error) {
  //         console.warn('JWT Verification Failed:', error.message);
  //         payload = null;
  //       }
  //     }

  //     const data = await this.prismaService.product.findUnique({
  //       include: {
  //         brands: true,
  //         models: true,
  //         categories: true,
  //         condition_product_conditionTocondition: true,
  //         components: {
  //           include: {
  //             component_type_components_component_typeTocomponent_type: true,
  //           },
  //         },
  //         product_reviews: {
  //           include: {
  //             users: {
  //               select: {
  //                 username: true,
  //                 profile: true,
  //                 created_at: true,
  //                 first_name: true,
  //                 last_name: true,
  //                 email: true,
  //                 phone: true,
  //                 gender: true,
  //               },
  //             },
  //             store_product_review_images: true,
  //           },
  //           orderBy: { created_at: 'desc' },
  //         },
  //         gaming_console: true,
  //         users: {
  //           select: {
  //             username: true,
  //             profile: true,
  //             created_at: true,
  //             first_name: true,
  //             last_name: true,
  //             email: true,
  //             phone: true,
  //             gender: true,
  //           },
  //         },
  //         personal_computers: {
  //           include: {
  //             processors: true,
  //             ram_personal_computers_ramToram: true,
  //             storage_personal_computers_storageTostorage: true,
  //             storage_type_personal_computers_storage_typeTostorage_type: true,
  //             gpu_personal_computers_gpuTogpu: true,
  //             processor_variant_personal_computers_processor_variantToprocessor_variant: true,
  //           },
  //         },
  //         laptops: {
  //           include: {
  //             ram_laptops_ramToram: true,
  //             storage_laptops_storageTostorage: true,
  //             storage_type_laptops_storage_typeTostorage_type: true,
  //             gpu_laptops_gpuTogpu: true,
  //             processors: true,
  //             processor_variant_laptops_processor_variantToprocessor_variant: true,
  //           },
  //         },
  //         product_images: true,
  //         location_product_locationTolocation: true,
  //       },
  //       where: { id: parseInt(pid.id) },
  //     });

  //     if (!data) {
  //       return { data: null, message: 'Product not found' };
  //     }

  //     // Generate signed URLs for product images
  //     const imageUrls = data.product_images.length
  //       ? await this.s3Service.get_image_urls(
  //           data.product_images.map((img) => img.image_url),
  //         )
  //       : [];
  //     const imagesWithUrls = data.product_images.map((img, index) => ({
  //       ...img,
  //       image_url: imageUrls[index],
  //     }));

  //     // Generate signed URLs for review images
  //     const reviewsWithImageUrls = await Promise.all(
  //       data.product_reviews.map(async (review) => {
  //         const reviewImageUrls = review.store_product_review_images.length
  //           ? await this.s3Service.get_image_urls(
  //               review.store_product_review_images.map((img) => img.image_url),
  //             )
  //           : [];
  //         const reviewImagesWithUrls = review.store_product_review_images.map(
  //           (img, index) => ({
  //             ...img,
  //             image_url: reviewImageUrls[index],
  //           }),
  //         );
  //         return {
  //           ...review,
  //           store_product_review_images: reviewImagesWithUrls,
  //         };
  //       }),
  //     );

  //     const isFavorite = payload
  //       ? (
  //           await this.prismaService.favourite_products.findMany({
  //             where: {
  //               user_id: parseInt(payload.id),
  //               product_id: data.id,
  //             },
  //           })
  //         ).length > 0
  //       : false;

  //     return {
  //       data: {
  //         ...data,
  //         product_images: imagesWithUrls,
  //         product_reviews: reviewsWithImageUrls,
  //         fav: isFavorite,
  //       },
  //       message: 'success',
  //     };
  //   } catch (e) {
  //     throw new InternalServerErrorException(e);
  //   }
  // }
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
          payload = null;
        }
      }

      const data = await this.prismaService.product.findUnique({
        include: {
          brands: true,
          models: true,
          categories: true,
          condition_product_conditionTocondition: true,
          components: {
            include: {
              component_type_components_component_typeTocomponent_type: true,
            },
          },
          product_reviews: {
            include: {
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
              store_product_review_images: true,
            },
            orderBy: { created_at: 'desc' },
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
        where: { id: parseInt(pid.id) },
      });

      if (!data) {
        return { data: null, message: 'Product not found' };
      }

      // Generate signed URLs for product images
      const imageUrls = data.product_images.length
        ? await this.s3Service.get_image_urls(
            data.product_images.map((img) => img.image_url),
          )
        : [];
      const imagesWithUrls = data.product_images.map((img, index) => ({
        ...img,
        image_url: imageUrls[index] || img.image_url, // Fallback to original URL
      }));

      // Generate signed URL for brand logo
      const brandWithLogoUrl = data.brands
        ? {
            ...data.brands,
            logo: data.brands.logo
              ? await this.s3Service.get_image_url(data.brands.logo)
              : null,
          }
        : null;

      // Generate signed URL for product owner user profile
      const userWithProfileUrl = data.users
        ? {
            ...data.users,
            profile: data.users.profile
              ? await this.s3Service.get_image_url(data.users.profile)
              : null,
          }
        : null;

      // Generate signed URLs for review images and reviewer user profiles
      const reviewsWithImageUrls = await Promise.all(
        data.product_reviews.map(async (review) => {
          // Signed URLs for review images
          const reviewImageUrls = review.store_product_review_images.length
            ? await this.s3Service.get_image_urls(
                review.store_product_review_images.map((img) => img.image_url),
              )
            : [];
          const reviewImagesWithUrls = review.store_product_review_images.map(
            (img, index) => ({
              ...img,
              image_url: reviewImageUrls[index] || img.image_url, // Fallback to original URL
            }),
          );

          // Signed URL for reviewer user profile
          const reviewerWithProfileUrl = review.users
            ? {
                ...review.users,
                profile: review.users.profile
                  ? await this.s3Service.get_image_url(review.users.profile)
                  : null,
              }
            : null;

          return {
            ...review,
            store_product_review_images: reviewImagesWithUrls,
            users: reviewerWithProfileUrl,
          };
        }),
      );

      const isFavorite = payload
        ? (
            await this.prismaService.favourite_products.findMany({
              where: {
                user_id: parseInt(payload.id),
                product_id: data.id,
              },
            })
          ).length > 0
        : false;

      return {
        data: {
          ...data,
          product_images: imagesWithUrls,
          product_reviews: reviewsWithImageUrls,
          brands: brandWithLogoUrl,
          users: userWithProfileUrl,
          fav: isFavorite,
        },
        message: 'success',
      };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async CreateProduct(
    productbody: CreateProductDto,
    images: Express.Multer.File[],
  ) {
    try {
      const data: Prisma.productCreateInput = {
        name: productbody.name,
        description: productbody.description,
        price: productbody.price,
        stock: productbody.stock,
        is_store_product: Boolean(productbody.is_store_product),
        brands:
          productbody.brand_id && parseInt(productbody.brand_id) != 0
            ? { connect: { id: parseInt(productbody.brand_id) } }
            : undefined,
        models:
          productbody.model_id && parseInt(productbody.model_id) != 0
            ? { connect: { id: parseInt(productbody.model_id) } }
            : undefined,
        categories: { connect: { id: parseInt(productbody.category_id) } },
        condition_product_conditionTocondition: {
          connect: { id: parseInt(productbody.condition) },
        },
        is_published: Boolean(productbody.is_published),
        is_verified_by_admin: false,
        show_on_home: false,
        top_rated: false,
        location_product_locationTolocation: {
          connect: { id: parseInt(productbody.location) },
        },
        other_brand_name: productbody.otherBrandName,
      };

      if (Boolean(productbody.is_store_product)) {
        data.admin_product_admin_idToadmin = {
          connect: { id: parseInt(productbody.user_id) },
        };
      } else {
        data.users = { connect: { id: parseInt(productbody.user_id) } };
      }

      const prod = await this.prismaService.product.create({ data });

      // Upload images to S3
      for (const image of images) {
        const uploaded = await this.s3Service.upload_file(image);
        await this.prismaService.product_images.create({
          data: {
            product_id: prod.id,
            image_url: uploaded.Key,
            created_at: new Date(),
          },
        });
      }

      // Category-specific data
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

      if (!Boolean(productbody.is_store_product)) {
        await this.prismaService.users.update({
          data: { is_seller: true },
          where: { id: parseInt(productbody.user_id) },
        });
      }

      return { message: 'success' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async UpdateProduct(productbody: any, images: Express.Multer.File[]) {
    try {
      const pro = await this.prismaService.product.findUnique({
        where: { id: parseInt(productbody.prod_id) },
      });
      if (!pro) {
        throw new BadRequestException('No Product Found');
      }

      const data: Prisma.productUpdateInput = {
        name: productbody.name,
        description: productbody.description,
        price: productbody.price,
        stock: productbody.stock,
        is_store_product: Boolean(productbody.is_store_product),
        brands: productbody.brand_id
          ? { connect: { id: parseInt(productbody.brand_id) } }
          : { disconnect: true },
        models:
          productbody.model_id && parseInt(productbody.model_id) != 0
            ? { connect: { id: parseInt(productbody.model_id) } }
            : { disconnect: true },
        categories: { connect: { id: parseInt(productbody.category_id) } },
        condition_product_conditionTocondition: {
          connect: { id: parseInt(productbody.condition) },
        },
        is_published:
          productbody.is_published === 'true' ||
          productbody.is_published === true,

        is_verified_by_admin: false,
        show_on_home: false,
        top_rated: false,
        location_product_locationTolocation: {
          connect: { id: parseInt(productbody.location) },
        },
        other_brand_name: productbody.otherBrandName,
      };

      await this.prismaService.product.update({
        where: { id: parseInt(productbody.prod_id) },
        data,
      });

      // if (images && images.length > 0) {
      //   // Delete existing images from S3
      //   const imagesToDelete = await this.prismaService.product_images.findMany(
      //     {
      //       where: { product_id: parseInt(productbody.prod_id) },
      //     },
      //   );
      //   for (const img of imagesToDelete) {
      //     await this.s3Service.deleteFileByKey(img.image_url);
      //   }
      //   await this.prismaService.product_images.deleteMany({
      //     where: { product_id: parseInt(productbody.prod_id) },
      //   });

      //   // Upload new images to S3
      //   for (const image of images) {
      //     const uploaded = await this.s3Service.upload_file(image);
      //     await this.prismaService.product_images.create({
      //       data: {
      //         product_id: parseInt(productbody.prod_id),
      //         image_url: uploaded.Key,
      //         created_at: new Date(),
      //       },
      //     });
      //   }
      // }
      if (images && images.length > 0) {
        // Just upload and add new images without deleting the old ones
        for (const image of images) {
          const uploaded = await this.s3Service.upload_file(image);
          await this.prismaService.product_images.create({
            data: {
              product_id: parseInt(productbody.prod_id),
              image_url: uploaded.Key,
              created_at: new Date(),
            },
          });
        }
      }

      // Category-specific updates
      if (parseInt(productbody.category_id) == 1) {
        await this.prismaService.laptops.updateMany({
          where: { product_id: parseInt(productbody.prod_id) },
          data: {
            ram: parseInt(productbody.laptops[0].ram),
            processor: parseInt(productbody.laptops[0].processor),
            storage: parseInt(productbody.laptops[0].storage),
            storage_type: parseInt(productbody.laptops[0].storage_type),
            gpu: parseInt(productbody.laptops[0].gpu),
            graphics: productbody.laptops[0].graphics,
            ports: productbody.laptops[0].ports,
            battery_life: productbody.laptops[0].battery_life,
            screen_size: productbody.laptops[0].screen_size,
            weight: productbody.laptops[0].weight,
            screen_resolution: productbody.laptops[0].screen_resolution,
            color: productbody.laptops[0].color,
            processor_variant: parseInt(
              productbody.laptops[0].processor_variant,
            ),
          },
        });
      } else if (parseInt(productbody.category_id) == 4) {
        await this.prismaService.gaming_console.updateMany({
          where: { product_id: parseInt(productbody.prod_id) },
          data: {
            accessories: productbody.gaming_console[0].accessories,
            warranty_status: productbody.gaming_console[0].warranty_status,
            color: productbody.gaming_console[0].color,
            battery_life: productbody.gaming_console[0].battery_life,
            connectivity: productbody.gaming_console[0].connectivity,
          },
        });
      } else if (parseInt(productbody.category_id) == 2) {
        await this.prismaService.personal_computers.updateMany({
          where: { product_id: parseInt(productbody.prod_id) },
          data: {
            ram: parseInt(productbody.personal_computers[0].ram),
            processor: parseInt(productbody.personal_computers[0].processor),
            processor_variant: parseInt(
              productbody.personal_computers[0].processor_variant,
            ),
            graphics: productbody.personal_computers[0].graphics,
            ports: productbody.personal_computers[0].ports,
            storage: parseInt(productbody.personal_computers[0].storage),
            storage_type: parseInt(
              productbody.personal_computers[0].storage_type,
            ),
            gpu: parseInt(productbody.personal_computers[0].gpu),
          },
        });
      } else if (parseInt(productbody.category_id) == 3) {
        await this.prismaService.components.updateMany({
          where: { product_id: parseInt(productbody.prod_id) },
          data: {
            component_type: parseInt(productbody.components[0].component_type),
            text: productbody.components[0].text,
          },
        });
      }

      return { message: 'Successfully Updated' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async AddReview(productbody: CreateReviewDto, images: Express.Multer.File[]) {
    try {
      const pro = await this.prismaService.product.findUnique({
        where: { id: parseInt(productbody.product_id) },
      });
      if (!pro) {
        throw new BadRequestException('No Product Found');
      }

      const rev = await this.prismaService.product_reviews.create({
        data: {
          ratings: parseInt(productbody.ratings),
          user_id: parseInt(productbody.user_id),
          product_id: parseInt(productbody.product_id),
          comments: productbody.comments,
        },
      });

      // Upload review images to S3
      for (const image of images) {
        const uploaded = await this.s3Service.upload_file(image);
        await this.prismaService.store_product_review_images.create({
          data: {
            review_id: rev.id,
            image_url: uploaded.Key,
            created_at: new Date(),
          },
        });
      }

      return { message: 'success added review' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async DeleteReviewById(data: any) {
    try {
      const rev = await this.prismaService.product_reviews.findUnique({
        where: { id: parseInt(data.review_id) },
      });
      if (!rev) {
        throw new BadRequestException('No Review Found');
      }

      // Delete review images from S3
      const revImages =
        await this.prismaService.store_product_review_images.findMany({
          where: { review_id: parseInt(data.review_id) },
        });
      for (const img of revImages) {
        await this.s3Service.deleteFileByKey(img.image_url);
      }

      await this.prismaService.store_product_review_images.deleteMany({
        where: { review_id: parseInt(data.review_id) },
      });
      await this.prismaService.product_reviews.delete({
        where: { id: parseInt(data.review_id) },
      });

      return { data, message: 'successfully deleted' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async GetUserProducts(queryData: any) {
    try {
      const limit = 8;
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

      const queryOptions: any = {
        include: {
          brands: true,
          models: true,
          categories: true,
          components: {
            include: {
              component_type_components_component_typeTocomponent_type: true,
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

      if (queryData.pageNo) {
        queryOptions.skip = (parseInt(queryData.pageNo, 10) - 1) * limit;
        queryOptions.take = limit;
      }

      const data: ProductWithRelations[] =
        await this.prismaService.product.findMany(queryOptions);
      const count = await this.prismaService.product.count({
        where: { user_id: parseInt(queryData.userId) },
      });

      const dataToSend = await Promise.all(
        data.map(async (e) => {
          const imageUrls = e.product_images.length
            ? await this.s3Service.get_image_urls(
                e.product_images.map((img) => img.image_url),
              )
            : [];
          const imagesWithUrls = e.product_images.map((img, index) => ({
            ...img,
            image_url: imageUrls[index],
          }));

          return {
            name: e.name,
            id: e.id,
            active: e.is_published,
            description: e.description,
            category: e.categories.name,
            price: e.price,
            images: imagesWithUrls,
          };
        }),
      );

      return { total: count, data: dataToSend, message: 'success' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch products',
        error.message,
      );
    }
  }

  async SearchProductByTitle(title: string) {
    try {
      const data: SearchProductWithRelations[] =
        await this.prismaService.product.findMany({
          where: {
            name: { contains: title, mode: 'insensitive' },
          },
          include: {
            brands: true,
            models: true,
            categories: true,
            condition_product_conditionTocondition: true,
            components: {
              include: {
                component_type_components_component_typeTocomponent_type: true,
              },
            },
            product_reviews: {
              include: {
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
                store_product_review_images: true,
              },
              orderBy: { created_at: 'desc' },
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
                storage_type_personal_computers_storage_typeTostorage_type:
                  true,
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
        });

      if (data.length === 0) {
        return { data: null, message: 'No products found' };
      }

      // Generate signed URLs for images
      const dataWithImageUrls = await Promise.all(
        data.map(async (e) => {
          const imageUrls = e.product_images.length
            ? await this.s3Service.get_image_urls(
                e.product_images.map((img) => img.image_url),
              )
            : [];
          const imagesWithUrls = e.product_images.map((img, index) => ({
            ...img,
            image_url: imageUrls[index],
          }));

          const reviewsWithImageUrls = await Promise.all(
            e.product_reviews.map(async (review) => {
              const reviewImageUrls = review.store_product_review_images.length
                ? await this.s3Service.get_image_urls(
                    review.store_product_review_images.map(
                      (img) => img.image_url,
                    ),
                  )
                : [];
              const reviewImagesWithUrls =
                review.store_product_review_images.map((img, index) => ({
                  ...img,
                  image_url: reviewImageUrls[index],
                }));
              return {
                ...review,
                store_product_review_images: reviewImagesWithUrls,
              };
            }),
          );

          return {
            ...e,
            product_images: imagesWithUrls,
            product_reviews: reviewsWithImageUrls,
          };
        }),
      );

      return { data: dataWithImageUrls, message: 'success' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async searchProducts(query: {
    query: string;
    pageNo?: string;
    limit?: string;
  }) {
    try {
      const searchTerm = query.query?.trim();
      if (!searchTerm) {
        return { products: [], total: 0, message: 'No search term provided' };
      }

      const page = parseInt(query.pageNo) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build where clause to search across multiple fields
      const whereParameters: Prisma.productWhereInput = {
        AND: [
          { is_published: true },
          {
            OR: [
              {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              },
              {
                description: {
                  contains: searchTerm,
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              },
              {
                other_brand_name: {
                  contains: searchTerm,
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              },
              {
                categories: {
                  name: {
                    contains: searchTerm,
                    mode: 'insensitive' as Prisma.QueryMode,
                  },
                },
              },
              {
                brands: {
                  name: {
                    contains: searchTerm,
                    mode: 'insensitive' as Prisma.QueryMode,
                  },
                },
              },
              {
                models: {
                  name: {
                    contains: searchTerm,
                    mode: 'insensitive' as Prisma.QueryMode,
                  },
                },
              },
            ],
          },
        ],
      };

      const [products, total] = await Promise.all([
        this.prismaService.product.findMany({
          where: whereParameters,
          include: {
            categories: { select: { id: true, name: true } },
            product_images: { select: { id: true, image_url: true } },
            brands: { select: { id: true, name: true } },
            models: { select: { id: true, name: true } },
          },
          skip,
          take: limit,
          orderBy: { name: 'asc' }, // Optional: sort by name for consistent results
        }),
        this.prismaService.product.count({ where: whereParameters }),
      ]);

      const productsWithImageUrls = await Promise.all(
        products.map(async (product) => {
          const imageUrls = product.product_images.length
            ? await this.s3Service.get_image_urls(
                product.product_images.map((img) => img.image_url),
              )
            : [];
          const imagesWithUrls = product.product_images.map((img, index) => ({
            ...img,
            image_url: imageUrls[index] || img.image_url,
          }));

          return {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.categories?.name,
            category_id: product.categories?.id,
            brand: product.brands?.name,
            brand_id: product.brands?.id,
            model: product.models?.name,
            model_id: product.models?.id,
            images: imagesWithUrls,
          };
        }),
      );

      return {
        products: productsWithImageUrls,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        message: 'success',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to search products',
        error.message,
      );
    }
  }
  async searchProductsByName(query: string) {
    try {
      const searchTerm = query?.trim();
      if (!searchTerm) {
        return { products: [], total: 0, message: 'No search term provided' };
      }

      const whereParameters: Prisma.productWhereInput = {
        AND: [
          { is_published: true },
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        ],
      };

      const [products, total] = await Promise.all([
        this.prismaService.product.findMany({
          where: whereParameters,
          include: {
            categories: { select: { id: true, name: true } },
            product_images: { select: { id: true, image_url: true } },
            brands: { select: { id: true, name: true } },
            models: { select: { id: true, name: true } },
          },
          orderBy: { name: 'asc' },
        }),
        this.prismaService.product.count({ where: whereParameters }),
      ]);

      const productsWithImageUrls = await Promise.all(
        products.map(async (product) => {
          const imageUrls = product.product_images.length
            ? await this.s3Service.get_image_urls(
                product.product_images.map((img) => img.image_url),
              )
            : [];
          const imagesWithUrls = product.product_images.map((img, index) => ({
            ...img,
            image_url: imageUrls[index] || img.image_url,
          }));

          return {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.categories?.name,
            category_id: product.categories?.id,
            brand: product.brands?.name,
            brand_id: product.brands?.id,
            model: product.models?.name,
            model_id: product.models?.id,
            images: imagesWithUrls,
          };
        }),
      );

      return {
        products: productsWithImageUrls,
        total,
        message: 'success',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to search products',
        error.message,
      );
    }
  }

  async DeleteProductImage(imageIds: string | string[]) {
    try {
      // Normalize input to always be an array
      const ids = Array.isArray(imageIds) ? imageIds : [imageIds];
      const parsedIds = ids
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));

      if (parsedIds.length === 0) {
        throw new BadRequestException('No valid image IDs provided');
      }

      // Fetch all images to be deleted
      const images = await this.prismaService.product_images.findMany({
        where: { id: { in: parsedIds } },
      });

      if (images.length === 0) {
        throw new BadRequestException('No images found for the provided IDs');
      }

      // Delete images from S3
      for (const image of images) {
        await this.s3Service.deleteFileByKey(image.image_url);
      }

      // Delete image records from database
      const deleteResult = await this.prismaService.product_images.deleteMany({
        where: { id: { in: parsedIds } },
      });

      return {
        message: `${deleteResult.count} image(s) successfully deleted`,
        deletedCount: deleteResult.count,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to delete image(s)',
        error.message,
      );
    }
  }
  async SetFeatured(productId: string) {
    try {
      const parsedId = parseInt(productId);
      if (isNaN(parsedId)) {
        throw new BadRequestException('Invalid product ID');
      }

      const product = await this.prismaService.product.findUnique({
        where: { id: parsedId },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      await this.prismaService.product.update({
        where: { id: parsedId },
        data: { is_featured: true },
      });

      return { message: 'Product marked as featured successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to mark product as featured',
        error.message,
      );
    }
  }

  async SetNonFeatured(productId: string) {
    try {
      const parsedId = parseInt(productId);
      if (isNaN(parsedId)) {
        throw new BadRequestException('Invalid product ID');
      }

      const product = await this.prismaService.product.findUnique({
        where: { id: parsedId },
      });

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      await this.prismaService.product.update({
        where: { id: parsedId },
        data: { is_featured: false },
      });

      return { message: 'Product marked as non-featured successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to mark product as non-featured',
        error.message,
      );
    }
  }

  async getStoreProductsWithOrders(): Promise<{ id: number; name: string }[]> {
    try {
      const products = await this.prismaService.product.findMany({
        where: {
          is_store_product: true,
          order_items: {
            some: {}, // Ensures at least one order_item exists
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc', // Sort by name for consistent dropdown
        },
      });
      return products;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch store products with orders',
        error.message,
      );
    }
  }

  async searchMyProducts(query: string, userId: number) {
    try {
      const searchTerm = query?.trim();
      if (!searchTerm) {
        throw new BadRequestException('No search term provided');
      }

      const whereParameters: Prisma.productWhereInput = {
        AND: [
          { user_id: userId },
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        ],
      };

      const [products, total] = await Promise.all([
        this.prismaService.product.findMany({
          where: whereParameters,
          include: {
            categories: { select: { id: true, name: true } },
            product_images: { select: { id: true, image_url: true } },
            brands: { select: { id: true, name: true } },
            models: { select: { id: true, name: true } },
          },
          orderBy: { name: 'asc' },
        }),
        this.prismaService.product.count({ where: whereParameters }),
      ]);

      const productsWithImageUrls = await Promise.all(
        products.map(async (product) => {
          const imageUrls = product.product_images.length
            ? await this.s3Service.get_image_urls(
                product.product_images.map((img) => img.image_url),
              )
            : [];
          const imagesWithUrls = product.product_images.map((img, index) => ({
            id: img.id,
            image_url: imageUrls[index] || img.image_url,
          }));

          return {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            category: product.categories?.name,
            category_id: product.categories?.id,
            brand: product.brands?.name,
            brand_id: product.brands?.id,
            model: product.models?.name,
            model_id: product.models?.id,
            images: imagesWithUrls,
          };
        }),
      );

      return {
        products: productsWithImageUrls,
        total,
        message: 'success',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to search user products',
        error.message,
      );
    }
  }

  // For ai bot
  async findProductByQuery(query: string) {
    return this.prismaService.product.findFirst({
      where: {
        OR: [
          //@ts-ignore
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true }, // only return ID
    });
  }
}
