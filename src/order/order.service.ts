import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CartService } from '../cart/cart.service';
import { S3Service } from '../utils/s3.service';

// Define JwtPayload interface locally
interface JwtPayload {
  id: number;
  [key: string]: any;
}

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private s3Service: S3Service,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: JwtPayload) {
    const { shipping_address, shipping_rate = 10.00 } = createOrderDto;
    const user_id = user.id;

    // Validate user existence
    const userRecord = await this.prisma.users.findUnique({ where: { id: user_id } });
    if (!userRecord) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    // Validate shipping_rate
    if (isNaN(shipping_rate) || shipping_rate < 0) {
      throw new BadRequestException('Shipping rate must be a non-negative number');
    }

    // Fetch cart items
    const items = await this.cartService.getCartItemsForOrder(user_id);

    // Fetch all products in one query
    const productIds = items.map(item => item.product_id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { product_images: true },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate stock, store product, and calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new NotFoundException(`Product with ID ${item.product_id} not found`);
      }
      if (!product.is_store_product) {
        throw new BadRequestException(`Product with ID ${item.product_id} is not a store product`);
      }

      const currentStock = parseInt(product.stock, 10);
      if (isNaN(currentStock)) {
        throw new BadRequestException(`Invalid stock value for product ID ${item.product_id}`);
      }
      if (currentStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ID ${item.product_id}. Available: ${currentStock}, Requested: ${item.quantity}`,
        );
      }

      const itemPrice = parseFloat(product.price);
      if (isNaN(itemPrice)) {
        throw new BadRequestException(`Invalid price for product ID ${item.product_id}`);
      }

      subtotal += itemPrice * item.quantity;
    }

    // Calculate total_amount including shipping_rate
    const totalAmount = subtotal + shipping_rate;

    // Create the order and update stock in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.orders.create({
        data: {
          user_id,
          total_amount: totalAmount.toFixed(2),
          shipping_rate: shipping_rate.toFixed(2),
          shipping_address,
          order_status: 'PENDING',
          created_at: new Date(),
          updated_at: new Date(),
          order_items: {
            create: items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: productMap.get(item.product_id).price,
              created_at: new Date(),
              updated_at: new Date(),
            })),
          },
        },
        include: {
          order_items: {
            include: {
              product: {
                include: {
                  product_images: true,
                },
              },
            },
          },
          users: true,
        },
      });

      // Generate signed URLs for product images
      const enrichedOrderItems = await Promise.all(
        order.order_items.map(async (item) => {
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

      // Update stock
      for (const item of items) {
        const product = productMap.get(item.product_id);
        const newStock = parseInt(product.stock, 10) - item.quantity;
        await prisma.product.update({
          where: { id: item.product_id },
          data: { stock: newStock.toString() },
        });
      }

      // Clear cart
      await this.cartService.clearCart(user_id);

      return {
        ...order,
        shipping_rate: parseFloat(order.shipping_rate),
        order_items: enrichedOrderItems,
      };
    });
  }

  async findAll(userId: number) {
    const orders = await this.prisma.orders.findMany({
      where: {
        user_id: userId,
        order_items: {
          every: {
            product: {
              is_store_product: true,
            },
          },
        },
      },
      include: {
        order_items: {
          include: {
            product: {
              include: {
                product_images: true,
              },
            },
          },
        },
        users: true,
        transactions: true,
      },
    });

    // Generate signed URLs for product images and parse shipping_rate
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const enrichedOrderItems = await Promise.all(
          order.order_items.map(async (item) => {
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
          ...order,
          shipping_rate: parseFloat(order.shipping_rate),
          order_items: enrichedOrderItems,
        };
      }),
    );

    return enrichedOrders;
  }

  async findOne(id: number, userId: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        order_items: {
          include: {
            product: {
              include: {
                product_images: true,
              },
            },
          },
        },
        users: true,
        transactions: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.user_id !== userId) {
      throw new NotFoundException(`Order with ID ${id} does not belong to user`);
    }

    const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
    if (hasNonStoreProduct) {
      throw new NotFoundException(`Order with ID ${id} contains non-store products`);
    }

    // Generate signed URLs for product images
    const enrichedOrderItems = await Promise.all(
      order.order_items.map(async (item) => {
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
      ...order,
      shipping_rate: parseFloat(order.shipping_rate),
      order_items: enrichedOrderItems,
    };
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        order_items: {
          include: {
            product: {
              include: {
                product_images: true,
              },
            },
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.user_id !== userId) {
      throw new NotFoundException(`Order with ID ${id} does not belong to user`);
    }

    const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
    if (hasNonStoreProduct) {
      throw new NotFoundException(`Order with ID ${id} contains non-store products`);
    }

    // Validate shipping_rate if provided
    if (updateOrderDto.shipping_rate !== undefined && (isNaN(updateOrderDto.shipping_rate) || updateOrderDto.shipping_rate < 0)) {
      throw new BadRequestException('Shipping rate must be a non-negative number');
    }

    const updatedOrder = await this.prisma.orders.update({
      where: { id },
      data: {
        order_status: updateOrderDto.order_status,
        shipping_address: updateOrderDto.shipping_address,
        shipping_rate: updateOrderDto.shipping_rate !== undefined ? updateOrderDto.shipping_rate.toFixed(2) : undefined,
        updated_at: new Date(),
      },
      include: {
        order_items: {
          include: {
            product: {
              include: {
                product_images: true,
              },
            },
          },
        },
        users: true,
        transactions: true,
      },
    });

    // Generate signed URLs for product images
    const enrichedOrderItems = await Promise.all(
      updatedOrder.order_items.map(async (item) => {
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
      ...updatedOrder,
      shipping_rate: parseFloat(updatedOrder.shipping_rate),
      order_items: enrichedOrderItems,
    };
  }

  async remove(id: number, userId: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        order_items: {
          include: {
            product: {
              include: {
                product_images: true,
              },
            },
          },
        },
        transactions: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.user_id !== userId) {
      throw new NotFoundException(`Order with ID ${id} does not belong to user`);
    }

    const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
    if (hasNonStoreProduct) {
      throw new NotFoundException(`Order with ID ${id} contains non-store products`);
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.order_items.deleteMany({
        where: { order_id: id },
      });

      await prisma.transactions.deleteMany({
        where: { order_id: id },
      });

      const deletedOrder = await prisma.orders.delete({
        where: { id },
        include: {
          order_items: {
            include: {
              product: {
                include: {
                  product_images: true,
                },
              },
            },
          },
          transactions: true,
        },
      });

      // Generate signed URLs for product images in deleted order
      const enrichedOrderItems = await Promise.all(
        deletedOrder.order_items.map(async (item) => {
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

      for (const item of order.order_items) {
        const product = item.product;
        if (product.is_store_product) {
          const currentStock = parseInt(product.stock, 10);
          if (isNaN(currentStock)) {
            throw new BadRequestException(`Invalid stock value for product ID ${item.product_id}`);
          }
          const newStock = currentStock + item.quantity;
          await prisma.product.update({
            where: { id: item.product_id },
            data: { stock: newStock.toString() },
          });
        }
      }

      return {
        ...deletedOrder,
        shipping_rate: parseFloat(deletedOrder.shipping_rate),
        order_items: enrichedOrderItems,
      };
    });
  }
}
// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderDto } from './dto/update-order.dto';
// import { CartService } from '../cart/cart.service';
// import { S3Service } from '../utils/s3.service';

// // Define JwtPayload interface locally
// interface JwtPayload {
//   id: number;
//   [key: string]: any;
// }

// @Injectable()
// export class OrderService {
//   constructor(
//     private prisma: PrismaService,
//     private cartService: CartService,
//     private s3Service: S3Service,
//   ) {}

//   async create(createOrderDto: CreateOrderDto, user: JwtPayload) {
//     const { shipping_address } = createOrderDto;
//     const user_id = user.id;

//     // Validate user existence
//     const userRecord = await this.prisma.users.findUnique({ where: { id: user_id } });
//     if (!userRecord) {
//       throw new NotFoundException(`User with ID ${user_id} not found`);
//     }

//     // Fetch cart items
//     const items = await this.cartService.getCartItemsForOrder(user_id);

//     // Fetch all products in one query
//     const productIds = items.map(item => item.product_id);
//     const products = await this.prisma.product.findMany({
//       where: { id: { in: productIds } },
//       include: { product_images: true },
//     });
//     const productMap = new Map(products.map(p => [p.id, p]));

//     // Validate stock, store product, and calculate total_amount
//     let totalAmount = 0;
//     for (const item of items) {
//       const product = productMap.get(item.product_id);
//       if (!product) {
//         throw new NotFoundException(`Product with ID ${item.product_id} not found`);
//       }
//       if (!product.is_store_product) {
//         throw new BadRequestException(`Product with ID ${item.product_id} is not a store product`);
//       }

//       const currentStock = parseInt(product.stock, 10);
//       if (isNaN(currentStock)) {
//         throw new BadRequestException(`Invalid stock value for product ID ${item.product_id}`);
//       }
//       if (currentStock < item.quantity) {
//         throw new BadRequestException(
//           `Insufficient stock for product ID ${item.product_id}. Available: ${product.stock}, Requested: ${item.quantity}`,
//         );
//       }

//       const itemPrice = parseFloat(product.price);
//       if (isNaN(itemPrice)) {
//         throw new BadRequestException(`Invalid price for product ID ${item.product_id}`);
//       }

//       totalAmount += itemPrice * item.quantity;
//     }

//     // Create the order and update stock in a transaction
//     return this.prisma.$transaction(async (prisma) => {
//       const order = await prisma.orders.create({
//         data: {
//           user_id,
//           total_amount: totalAmount.toFixed(2),
//           shipping_address,
//           order_status: 'PENDING',
//           created_at: new Date(),
//           updated_at: new Date(),
//           order_items: {
//             create: items.map(item => ({
//               product_id: item.product_id,
//               quantity: item.quantity,
//               price: productMap.get(item.product_id).price,
//               created_at: new Date(),
//               updated_at: new Date(),
//             })),
//           },
//         },
//         include: {
//           order_items: {
//             include: {
//               product: {
//                 include: {
//                   product_images: true,
//                 },
//               },
//             },
//           },
//           users: true,
//         },
//       });

//       // Generate signed URLs for product images
//       const enrichedOrderItems = await Promise.all(
//         order.order_items.map(async (item) => {
//           const imagesWithUrls = await Promise.all(
//             item.product.product_images.map(async (image) => ({
//               ...image,
//               image_url: await this.s3Service.get_image_url(image.image_url),
//             })),
//           );
//           return {
//             ...item,
//             product: {
//               ...item.product,
//               product_images: imagesWithUrls,
//             },
//           };
//         }),
//       );

//       // Update stock
//       for (const item of items) {
//         const product = productMap.get(item.product_id);
//         const newStock = parseInt(product.stock, 10) - item.quantity;
//         await prisma.product.update({
//           where: { id: item.product_id },
//           data: { stock: newStock.toString() },
//         });
//       }

//       // Clear cart
//       await this.cartService.clearCart(user_id);

//       return {
//         ...order,
//         order_items: enrichedOrderItems,
//       };
//     });
//   }

//   async findAll() {
//     const orders = await this.prisma.orders.findMany({
//       where: {
//         order_items: {
//           every: {
//             product: {
//               is_store_product: true,
//             },
//           },
//         },
//       },
//       include: {
//         order_items: {
//           include: {
//             product: {
//               include: {
//                 product_images: true,
//               },
//             },
//           },
//         },
//         users: true,
//         transactions: true,
//       },
//     });

//     // Generate signed URLs for product images
//     const enrichedOrders = await Promise.all(
//       orders.map(async (order) => {
//         const enrichedOrderItems = await Promise.all(
//           order.order_items.map(async (item) => {
//             const imagesWithUrls = await Promise.all(
//               item.product.product_images.map(async (image) => ({
//                 ...image,
//                 image_url: await this.s3Service.get_image_url(image.image_url),
//               })),
//             );
//             return {
//               ...item,
//               product: {
//                 ...item.product,
//                 product_images: imagesWithUrls,
//               },
//             };
//           }),
//         );
//         return {
//           ...order,
//           order_items: enrichedOrderItems,
//         };
//       }),
//     );

//     return enrichedOrders;
//   }

//   async findOne(id: number) {
//     const order = await this.prisma.orders.findUnique({
//       where: { id },
//       include: {
//         order_items: {
//           include: {
//             product: {
//               include: {
//                 product_images: true,
//               },
//             },
//           },
//         },
//         users: true,
//         transactions: true,
//       },
//     });

//     if (!order) {
//       throw new NotFoundException(`Order with ID ${id} not found`);
//     }

//     const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
//     if (hasNonStoreProduct) {
//       throw new NotFoundException(`Order with ID ${id} contains non-store products`);
//     }

//     // Generate signed URLs for product images
//     const enrichedOrderItems = await Promise.all(
//       order.order_items.map(async (item) => {
//         const imagesWithUrls = await Promise.all(
//           item.product.product_images.map(async (image) => ({
//             ...image,
//             image_url: await this.s3Service.get_image_url(image.image_url),
//           })),
//         );
//         return {
//           ...item,
//           product: {
//             ...item.product,
//             product_images: imagesWithUrls,
//           },
//         };
//       }),
//     );

//     return {
//       ...order,
//       order_items: enrichedOrderItems,
//     };
//   }

//   async update(id: number, updateOrderDto: UpdateOrderDto) {
//     const order = await this.prisma.orders.findUnique({
//       where: { id },
//       include: {
//         order_items: {
//           include: {
//             product: {
//               include: {
//                 product_images: true,
//               },
//             },
//           },
//         },
//       },
//     });
//     if (!order) {
//       throw new NotFoundException(`Order with ID ${id} not found`);
//     }

//     const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
//     if (hasNonStoreProduct) {
//       throw new NotFoundException(`Order with ID ${id} contains non-store products`);
//     }

//     const updatedOrder = await this.prisma.orders.update({
//       where: { id },
//       data: {
//         order_status: updateOrderDto.order_status,
//         shipping_address: updateOrderDto.shipping_address,
//         updated_at: new Date(),
//       },
//       include: {
//         order_items: {
//           include: {
//             product: {
//               include: {
//                 product_images: true,
//               },
//             },
//           },
//         },
//         users: true,
//         transactions: true,
//       },
//     });

//     // Generate signed URLs for product images
//     const enrichedOrderItems = await Promise.all(
//       updatedOrder.order_items.map(async (item) => {
//         const imagesWithUrls = await Promise.all(
//           item.product.product_images.map(async (image) => ({
//             ...image,
//             image_url: await this.s3Service.get_image_url(image.image_url),
//           })),
//         );
//         return {
//           ...item,
//           product: {
//             ...item.product,
//             product_images: imagesWithUrls,
//           },
//         };
//       }),
//     );

//     return {
//       ...updatedOrder,
//       order_items: enrichedOrderItems,
//     };
//   }

//   async remove(id: number) {
//     const order = await this.prisma.orders.findUnique({
//       where: { id },
//       include: {
//         order_items: {
//           include: {
//             product: {
//               include: {
//                 product_images: true,
//               },
//             },
//           },
//         },
//         transactions: true,
//       },
//     });
//     if (!order) {
//       throw new NotFoundException(`Order with ID ${id} not found`);
//     }

//     const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
//     if (hasNonStoreProduct) {
//       throw new NotFoundException(`Order with ID ${id} contains non-store products`);
//     }

//     return this.prisma.$transaction(async (prisma) => {
//       await prisma.order_items.deleteMany({
//         where: { order_id: id },
//       });

//       await prisma.transactions.deleteMany({
//         where: { order_id: id },
//       });

//       const deletedOrder = await prisma.orders.delete({
//         where: { id },
//         include: {
//           order_items: {
//             include: {
//               product: {
//                 include: {
//                   product_images: true,
//                 },
//               },
//             },
//           },
//           transactions: true,
//         },
//       });

//       // Generate signed URLs for product images in deleted order
//       const enrichedOrderItems = await Promise.all(
//         deletedOrder.order_items.map(async (item) => {
//           const imagesWithUrls = await Promise.all(
//             item.product.product_images.map(async (image) => ({
//               ...image,
//               image_url: await this.s3Service.get_image_url(image.image_url),
//             })),
//           );
//           return {
//             ...item,
//             product: {
//               ...item.product,
//               product_images: imagesWithUrls,
//             },
//           };
//         }),
//       );

//       for (const item of order.order_items) {
//         const product = item.product;
//         if (product.is_store_product) {
//           const currentStock = parseInt(product.stock, 10);
//           if (isNaN(currentStock)) {
//             throw new BadRequestException(`Invalid stock value for product ID ${item.product_id}`);
//           }
//           const newStock = currentStock + item.quantity;
//           await prisma.product.update({
//             where: { id: item.product_id },
//             data: { stock: newStock.toString() },
//           });
//         }
//       }

//       return {
//         ...deletedOrder,
//         order_items: enrichedOrderItems,
//       };
//     });
//   }
// }