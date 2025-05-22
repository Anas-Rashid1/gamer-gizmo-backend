

// import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { AddCartItemDto } from './dto/cart.dto';

// @Injectable()
// export class CartService {
//   constructor(private prisma: PrismaService) {}

//   async addItem(addCartItemDto: AddCartItemDto, userId: number) {
//     const { product_id, quantity } = addCartItemDto;

//     // Validate product
//     const product = await this.prisma.product.findUnique({
//       where: { id: product_id },
//     });
//     if (!product) {
//       throw new NotFoundException(`Product with ID ${product_id} not found`);
//     }
//     if (!product.is_store_product) {
//       throw new BadRequestException(`Product with ID ${product_id} is not a store product`);
//     }
//     const currentStock = parseInt(product.stock, 10);
//     if (isNaN(currentStock)) {
//       throw new BadRequestException(`Invalid stock value for product ID ${product_id}`);
//     }
//     if (currentStock < quantity) {
//       throw new BadRequestException(
//         `Insufficient stock for product ID ${product_id}. Available: ${product.stock}, Requested: ${quantity}`,
//       );
//     }

//     // Get or create cart
//     let cart = await this.prisma.cart.findFirst({
//       where: { user_id: userId },
//       include: { cart_items: true },
//     });
//     if (!cart) {
//       cart = await this.prisma.cart.create({
//         data: {
//           user_id: userId,
//           created_at: new Date(),
//           updated_at: new Date(),
//         },
//         include: { cart_items: true }, // Include cart_items to match type
//       });
//     }

//     // Check if item already exists in cart
//     const existingItem = await this.prisma.cart_items.findFirst({
//       where: { cart_id: cart.id, product_id },
//     });

//     if (existingItem) {
//       // Update quantity
//       const newQuantity = existingItem.quantity + quantity;
//       if (currentStock < newQuantity) {
//         throw new BadRequestException(
//           `Insufficient stock for product ID ${product_id}. Available: ${product.stock}, Requested: ${newQuantity}`,
//         );
//       }
//       return this.prisma.cart_items.update({
//         where: { id: existingItem.id },
//         data: {
//           quantity: newQuantity,
//           price: product.price,
//           updated_at: new Date(),
//         },
//         include: { product: true, cart: true },
//       });
//     } else {
//       // Add new item
//       return this.prisma.cart_items.create({
//         data: {
//           cart_id: cart.id,
//           product_id,
//           quantity,
//           price: product.price,
//           created_at: new Date(),
//           updated_at: new Date(),
//         },
//         include: { product: true, cart: true },
//       });
//     }
//   }

//   async getCart(userId: number) {
//     const cart = await this.prisma.cart.findFirst({
//       where: {
//         user_id: userId,
//         cart_items: {
//           every: {
//             product: {
//               is_store_product: true,
//             },
//           },
//         },
//       },
//       include: {
//         cart_items: {
//           include: {
//             product: true,
//           },
//         },
//         users: true,
//       },
//     });
//     return cart || { id: null, user_id: userId, cart_items: [], users: null };
//   }

//   async removeItem(userId: number, productId: number) {
//     const cart = await this.prisma.cart.findFirst({
//       where: { user_id: userId },
//       include: { cart_items: true },
//     });
//     if (!cart) {
//       throw new NotFoundException(`Cart not found for user ID ${userId}`);
//     }

//     const cartItem = await this.prisma.cart_items.findFirst({
//       where: { cart_id: cart.id, product_id: productId },
//     });
//     if (!cartItem) {
//       throw new NotFoundException(`Product ID ${productId} not found in cart`);
//     }

//     await this.prisma.cart_items.delete({
//       where: { id: cartItem.id },
//     });

//     return { message: `Product ID ${productId} removed from cart` };
//   }

//   async clearCart(userId: number) {
//     const cart = await this.prisma.cart.findFirst({
//       where: { user_id: userId },
//       include: { cart_items: true },
//     });
//     if (!cart) {
//       return { message: 'Cart is already empty' };
//     }

//     await this.prisma.cart_items.deleteMany({
//       where: { cart_id: cart.id },
//     });

//     return { message: 'Cart cleared successfully' };
//   }

//   // Utility method for OrderService to get cart items
//   async getCartItemsForOrder(userId: number) {
//     const cart = await this.prisma.cart.findFirst({
//       where: {
//         user_id: userId,
//         cart_items: {
//           every: {
//             product: {
//               is_store_product: true,
//             },
//           },
//         },
//       },
//       include: {
//         cart_items: {
//           include: { product: true },
//         },
//       },
//     });

//     if (!cart || cart.cart_items.length === 0) {
//       throw new BadRequestException('Cart is empty');
//     }

//     return cart.cart_items.map(item => ({
//       product_id: item.product_id,
//       quantity: item.quantity,
//       price: item.price,
//     }));
//   }
// }


import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/cart.dto';
import { S3Service } from '../utils/s3.service';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async addItem(addCartItemDto: AddCartItemDto, userId: number) {
    const { product_id, quantity } = addCartItemDto;

    // Validate product
    const product = await this.prisma.product.findUnique({
      where: { id: product_id },
      include: { product_images: true }, // Include product images
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
        include: { cart_items: true },
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
      const updatedItem = await this.prisma.cart_items.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          price: product.price,
          updated_at: new Date(),
        },
        include: {
          product: {
            include: {
              product_images: true, // Include product images
            },
          },
          cart: true,
        },
      });

      // Generate signed URLs for product images
      const imagesWithUrls = await Promise.all(
        updatedItem.product.product_images.map(async (image) => ({
          ...image,
          image_url: await this.s3Service.get_image_url(image.image_url),
        })),
      );

      return {
        ...updatedItem,
        product: {
          ...updatedItem.product,
          product_images: imagesWithUrls,
        },
      };
    } else {
      // Add new item
      const newItem = await this.prisma.cart_items.create({
        data: {
          cart_id: cart.id,
          product_id,
          quantity,
          price: product.price,
          created_at: new Date(),
          updated_at: new Date(),
        },
        include: {
          product: {
            include: {
              product_images: true, // Include product images
            },
          },
          cart: true,
        },
      });

      // Generate signed URLs for product images
      const imagesWithUrls = await Promise.all(
        newItem.product.product_images.map(async (image) => ({
          ...image,
          image_url: await this.s3Service.get_image_url(image.image_url),
        })),
      );

      return {
        ...newItem,
        product: {
          ...newItem.product,
          product_images: imagesWithUrls,
        },
      };
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
            product: {
              include: {
                product_images: true, // Include product images
              },
            },
          },
        },

      },
    });

    if (!cart) {
      return { id: null, user_id: userId, cart_items: [], users: null };
    }

    // Generate signed URLs for all product images in cart items
    const enrichedCartItems = await Promise.all(
      cart.cart_items.map(async (item) => {
        const imagesWithUrls = await Promise.all(
          item.product.product_images.map(async (image) => ({
            ...image,
            image_url: await this.s3Service.get_image_url(image.image_url),
          })),
        );
        return {
          ...item,
          product: {
            ...item.product,
            product_images: imagesWithUrls,
          },
        };
      }),
    );

    return {
      ...cart,
      cart_items: enrichedCartItems,
    };
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
          include: {
            product: {
              include: {
                product_images: true, // Include product images
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cart_items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Generate signed URLs for product images
    const enrichedCartItems = await Promise.all(
      cart.cart_items.map(async (item) => {
        const imagesWithUrls = await Promise.all(
          item.product.product_images.map(async (image) => ({
            ...image,
            image_url: await this.s3Service.get_image_url(image.image_url),
          })),
        );
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          product: {
            ...item.product,
            product_images: imagesWithUrls,
          },
        };
      }),
    );

    return enrichedCartItems;
  }
}