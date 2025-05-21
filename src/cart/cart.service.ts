// import {
//   BadRequestException,
//   Injectable,
//   InternalServerErrorException,
// } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateProductDto } from './dto/cart.dto';
// import * as fs from 'fs/promises';
// import { CreateReviewDto } from './dto/review.dto';

// @Injectable()
// export class CartService {
//   constructor(private prismaService: PrismaService) {}
//   async getUserCarts(queryData: any) {
//     try {
//       const limit = 10;

//       // Pagination setup
//       const queryOptions: any = {
//         include: {
//           cart_items: true,
//           // products: {
//           //   include: {
//           //     brands: true,
//           //     models: true,
//           //     categories: true,
//           //     components: {
//           //       include: {
//           //         component_type_components_component_typeTocomponent_type:
//           //           true, // Correct relation
//           //       },
//           //     },
//           //     personal_computers: true,
//           //     laptops: true,
//           //     product_images: true,
//           //   },
//           // },
//         },
//         where: {
//           user_id: parseInt(queryData.user_id),
//         },
//       };

//       if (queryData.pageNo) {
//         queryOptions.skip = (parseInt(queryData.pageNo, 10) - 1) * limit;
//         queryOptions.take = limit;
//       }

//       const data = await this.prismaService.cart.findMany(queryOptions);

//       return { data, message: 'success' };
//     } catch (error) {
//       // Throw a standardized internal server error
//       throw new InternalServerErrorException(
//         'Failed to fetch products',
//         error.message,
//       );
//     }
//   }

//   async DeleteProductById(pid: any) {
//     try {
//       // let data = await this.prismaService.product.findUnique({
//       //   where: {
//       //     id: parseInt(pid.product_id),
//       //   },
//       // });
//       // if (!data) {
//       //   throw new BadRequestException('No Product Found');
//       // }
//       // if (data.user_id != pid.user_id) {
//       //   throw new BadRequestException('Not Allowed');
//       // }
//       // let images = await this.prismaService.product_images.findMany({
//       //   where: {
//       //     product_id: parseInt(pid.product_id),
//       //   },
//       // });
//       // for (let i = 0; images.length > i; i++) {
//       //   await fs.unlink(images[i].image_url);
//       // }
//       // await this.prismaService.product_images.deleteMany({
//       //   where: {
//       //     product_id: parseInt(pid.product_id),
//       //   },
//       // });
//       // await this.prismaService.laptops.deleteMany({
//       //   where: {
//       //     product_id: parseInt(pid.product_id),
//       //   },
//       // });
//       // await this.prismaService.personal_computers.deleteMany({
//       //   where: {
//       //     product_id: parseInt(pid.product_id),
//       //   },
//       // });
//       // await this.prismaService.components.deleteMany({
//       //   where: {
//       //     product_id: parseInt(pid.product_id),
//       //   },
//       // });
//       // let rev = await this.prismaService.review.findMany({
//       //   where: {
//       //     product_id: parseInt(pid.product_id),
//       //   },
//       // });
//       // for (let i = 0; rev.length > i; i++) {
//       //   let rev_images = await this.prismaService.review_images.findMany({
//       //     where: {
//       //       review_id: rev[i].id,
//       //     },
//       //   });
//       //   for (let i = 0; rev_images.length > i; i++) {
//       //     await fs.unlink(rev_images[i].image_url);
//       //   }
//       //   await this.prismaService.review_images.deleteMany({
//       //     where: {
//       //       review_id: rev[i].id,
//       //     },
//       //   });
//       // }
//       // await this.prismaService.review.deleteMany({
//       //   where: {
//       //     product_id: parseInt(pid.product_id),
//       //   },
//       // });
//       // await this.prismaService.product.delete({
//       //   where: {
//       //     id: parseInt(pid.product_id),
//       //   },
//       // });
//       // console.log(images, 'data');

//       return { data: 'data', message: 'successfully deleted' };
//     } catch (e) {
//       console.log(e);
//       throw new InternalServerErrorException(e);
//     }
//   }

//   async AddItemToCart(productbody: CreateProductDto, images) {
//     try {
//       return { message: 'success' };
//     } catch (e) {
//       console.log(e);
//       for (let i = 0; images.length > i; i++) {
//         await fs.unlink(images[i].path);
//       }
//       throw new InternalServerErrorException(e);
//     }
//   }
// }


import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async addItem(addCartItemDto: AddCartItemDto, userId: number) {
    const { product_id, quantity } = addCartItemDto;

    // Validate product
    const product = await this.prisma.product.findUnique({
      where: { id: product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found`);
    }
    if (!product.is_store_product) {
      throw new BadRequestException(`Product with ID ${product_id} is not a store product`);
    }
    const currentStock = parseInt(product.stock, 10);
    if (isNaN(currentStock)) {
      throw new BadRequestException(`Invalid stock value for product ID ${product_id}`);
    }
    if (currentStock < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ID ${product_id}. Available: ${product.stock}, Requested: ${quantity}`,
      );
    }

    // Get or create cart
    let cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
      include: { cart_items: true },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        include: { cart_items: true }, // Include cart_items to match type
      });
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cart_items.findFirst({
      where: { cart_id: cart.id, product_id },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (currentStock < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock for product ID ${product_id}. Available: ${product.stock}, Requested: ${newQuantity}`,
        );
      }
      return this.prisma.cart_items.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          price: product.price,
          updated_at: new Date(),
        },
        include: { product: true, cart: true },
      });
    } else {
      // Add new item
      return this.prisma.cart_items.create({
        data: {
          cart_id: cart.id,
          product_id,
          quantity,
          price: product.price,
          created_at: new Date(),
          updated_at: new Date(),
        },
        include: { product: true, cart: true },
      });
    }
  }

  async getCart(userId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        user_id: userId,
        cart_items: {
          every: {
            product: {
              is_store_product: true,
            },
          },
        },
      },
      include: {
        cart_items: {
          include: {
            product: true,
          },
        },
        users: true,
      },
    });
    return cart || { id: null, user_id: userId, cart_items: [], users: null };
  }

  async removeItem(userId: number, productId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
      include: { cart_items: true },
    });
    if (!cart) {
      throw new NotFoundException(`Cart not found for user ID ${userId}`);
    }

    const cartItem = await this.prisma.cart_items.findFirst({
      where: { cart_id: cart.id, product_id: productId },
    });
    if (!cartItem) {
      throw new NotFoundException(`Product ID ${productId} not found in cart`);
    }

    await this.prisma.cart_items.delete({
      where: { id: cartItem.id },
    });

    return { message: `Product ID ${productId} removed from cart` };
  }

  async clearCart(userId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: { user_id: userId },
      include: { cart_items: true },
    });
    if (!cart) {
      return { message: 'Cart is already empty' };
    }

    await this.prisma.cart_items.deleteMany({
      where: { cart_id: cart.id },
    });

    return { message: 'Cart cleared successfully' };
  }

  // Utility method for OrderService to get cart items
  async getCartItemsForOrder(userId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        user_id: userId,
        cart_items: {
          every: {
            product: {
              is_store_product: true,
            },
          },
        },
      },
      include: {
        cart_items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.cart_items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return cart.cart_items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));
  }
}