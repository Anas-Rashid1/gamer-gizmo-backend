import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CartService } from '../cart/cart.service';
import { S3Service } from '../utils/s3.service';
import Stripe from 'stripe';

// Define JwtPayload interface locally
interface JwtPayload {
  id: number;
  [key: string]: any;
}

@Injectable()
export class OrderService {
  private stripe: Stripe;
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private s3Service: S3Service,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createPaymentIntent(dto: CreateOrderDto, user: JwtPayload) {
    const { shipping_address, shipping_rate = 10.0 } = dto;
    const user_id = user.id;

    const items = await this.cartService.getCartItemsForOrder(user_id);
    if (!items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const productIds = items.map((item) => item.product_id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product || !product.is_store_product) {
        throw new BadRequestException(`Invalid product ID ${item.product_id}`);
      }

      const price = parseFloat(product.price);
      if (isNaN(price)) {
        throw new BadRequestException(
          `Invalid price for product ID ${item.product_id}`,
        );
      }

      subtotal += price * item.quantity;
    }

    const totalAmount = subtotal + shipping_rate;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      metadata: {
        user_id: user_id.toString(),
        shipping_rate: shipping_rate.toString(),
        subtotal: subtotal.toString(),
        shipping_address: JSON.stringify(shipping_address),
        items: JSON.stringify(
          items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          })),
        ),
      },
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  async create(createOrderDto: CreateOrderDto, user: JwtPayload) {
    const { shipping_address, shipping_rate = 10.0 } = createOrderDto;
    const user_id = user.id;

    // Validate user existence
    const userRecord = await this.prisma.users.findUnique({
      where: { id: user_id },
    });
    if (!userRecord) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    // Validate shipping_rate
    if (isNaN(shipping_rate) || shipping_rate < 0) {
      throw new BadRequestException(
        'Shipping rate must be a non-negative number',
      );
    }

    // Fetch cart items
    const items = await this.cartService.getCartItemsForOrder(user_id);

    // Fetch all products in one query
    const productIds = items.map((item) => item.product_id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { product_images: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock, store product, and calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.product_id} not found`,
        );
      }
      if (!product.is_store_product) {
        throw new BadRequestException(
          `Product with ID ${item.product_id} is not a store product`,
        );
      }

      const currentStock = parseInt(product.stock, 10);
      if (isNaN(currentStock)) {
        throw new BadRequestException(
          `Invalid stock value for product ID ${item.product_id}`,
        );
      }
      if (currentStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ID ${item.product_id}. Available: ${currentStock}, Requested: ${item.quantity}`,
        );
      }

      const itemPrice = parseFloat(product.price);
      if (isNaN(itemPrice)) {
        throw new BadRequestException(
          `Invalid price for product ID ${item.product_id}`,
        );
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
            create: items.map((item) => ({
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

  async createOrderFromWebhook(data: {
    user_id: number;
    items: { product_id: number; quantity: number }[];
    shipping_address: any;
    shipping_rate: number;
    payment_method: 'online';
    payment_intent: string;
  }) {
    const {
      user_id,
      items,
      shipping_address,
      shipping_rate,
      payment_method,
      payment_intent,
    } = data;

    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.product_id) } },
      include: { product_images: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product || !product.is_store_product) {
        throw new BadRequestException(`Invalid product ID ${item.product_id}`);
      }

      const currentStock = parseInt(product.stock, 10);
      const itemPrice = parseFloat(product.price);
      if (currentStock < item.quantity || isNaN(itemPrice)) {
        throw new BadRequestException(
          `Invalid stock or price for product ID ${item.product_id}`,
        );
      }

      subtotal += itemPrice * item.quantity;
    }

    const totalAmount = subtotal + shipping_rate;

    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.orders.create({
        data: {
          user_id,
          total_amount: totalAmount.toFixed(2),
          shipping_rate: shipping_rate.toFixed(2),
          shipping_address,
          order_status: 'PENDING',
          payment_method,
          created_at: new Date(),
          updated_at: new Date(),
          order_items: {
            create: items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: productMap.get(item.product_id).price,
              created_at: new Date(),
              updated_at: new Date(),
            })),
          },
        },
      });

      for (const item of items) {
        const product = productMap.get(item.product_id);
        const newStock = parseInt(product.stock, 10) - item.quantity;
        await prisma.product.update({
          where: { id: item.product_id },
          data: { stock: newStock.toString() },
        });
      }

      await this.cartService.clearCart(user_id);

      await prisma.transactions.create({
        data: {
          order_id: order.id,
          payment_amount: totalAmount.toFixed(2),
          transaction_status: 'paid',
          payment_method,
          transaction_date: new Date(),
          payment_intent,
        },
      });

      return { order_id: order.id, status: 'created' };
    });
  }

  //   async create(createOrderDto: CreateOrderDto, user: JwtPayload) {
  //     const {
  //       shipping_address,
  //       shipping_rate = 10.0,
  //       payment_method,
  //     } = createOrderDto;
  //     const user_id = user.id;

  //     const userRecord = await this.prisma.users.findUnique({
  //       where: { id: user_id },
  //     });
  //     if (!userRecord) {
  //       throw new NotFoundException(`User with ID ${user_id} not found`);
  //     }

  //     if (isNaN(shipping_rate) || shipping_rate < 0) {
  //       throw new BadRequestException(
  //         'Shipping rate must be a non-negative number',
  //       );
  //     }

  //     const items = await this.cartService.getCartItemsForOrder(user_id);
  //     const productIds = items.map((item) => item.product_id);
  //     const products = await this.prisma.product.findMany({
  //       where: { id: { in: productIds } },
  //       include: { product_images: true },
  //     });
  //     const productMap = new Map(products.map((p) => [p.id, p]));

  //     let subtotal = 0;
  //     for (const item of items) {
  //       const product = productMap.get(item.product_id);
  //       if (!product || !product.is_store_product) {
  //         throw new BadRequestException(`Invalid product ID ${item.product_id}`);
  //       }

  //       const currentStock = parseInt(product.stock, 10);
  //       const itemPrice = parseFloat(product.price);
  //       if (currentStock < item.quantity || isNaN(itemPrice)) {
  //         throw new BadRequestException(
  //           `Invalid stock or price for product ID ${item.product_id}`,
  //         );
  //       }

  //       subtotal += itemPrice * item.quantity;
  //     }

  //     const totalAmount = subtotal + shipping_rate;

  //     return this.prisma.$transaction(async (prisma) => {
  //       const order = await prisma.orders.create({
  //         data: {
  //           user_id,
  //           total_amount: totalAmount.toFixed(2),
  //           shipping_rate: shipping_rate.toFixed(2),
  //           shipping_address,
  //           order_status: 'PENDING',
  //           payment_method,
  //           created_at: new Date(),
  //           updated_at: new Date(),
  //           order_items: {
  //             create: items.map((item) => ({
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
  //         },
  //       });

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

  //       for (const item of items) {
  //         const product = productMap.get(item.product_id);
  //         const newStock = parseInt(product.stock, 10) - item.quantity;
  //         await prisma.product.update({
  //           where: { id: item.product_id },
  //           data: { stock: newStock.toString() },
  //         });
  //       }

  //       await this.cartService.clearCart(user_id);

  //       const transactionData: any = {
  //         order_id: order.id,
  //         payment_amount: totalAmount.toFixed(2),
  //         transaction_status:
  //           payment_method === 'cash_on_delivery' ? 'pending' : 'initiated',
  //         payment_method,
  //         transaction_date: new Date(),
  //       };

  //       let paymentIntent;
  // if (payment_method === 'online') {
  //   try {
  //     paymentIntent = await this.stripe.paymentIntents.create({
  //       amount: Math.round(totalAmount * 100),
  //       currency: 'usd',
  //       metadata: {
  //         order_id: order.id.toString(),
  //         items: JSON.stringify(items),
  //       },
  //     });
  //     transactionData.payment_intent = paymentIntent.id;
  //   } catch (err) {
  //     throw new BadRequestException('Stripe payment initiation failed');
  //   }
  // }

  //       const transaction = await this.prisma.transactions.create({
  //         data: transactionData,
  //       });

  //       return {
  //         ...order,
  //         shipping_rate: parseFloat(order.shipping_rate),
  //         order_items: enrichedOrderItems,
  //         transaction,
  //       };
  //     });
  //   }

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
      throw new NotFoundException(
        `Order with ID ${id} does not belong to user`,
      );
    }

    const hasNonStoreProduct = order.order_items.some(
      (item) => !item.product.is_store_product,
    );
    if (hasNonStoreProduct) {
      throw new NotFoundException(
        `Order with ID ${id} contains non-store products`,
      );
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
      throw new NotFoundException(
        `Order with ID ${id} does not belong to user`,
      );
    }

    const hasNonStoreProduct = order.order_items.some(
      (item) => !item.product.is_store_product,
    );
    if (hasNonStoreProduct) {
      throw new NotFoundException(
        `Order with ID ${id} contains non-store products`,
      );
    }

    // Validate shipping_rate if provided
    if (
      updateOrderDto.shipping_rate !== undefined &&
      (isNaN(updateOrderDto.shipping_rate) || updateOrderDto.shipping_rate < 0)
    ) {
      throw new BadRequestException(
        'Shipping rate must be a non-negative number',
      );
    }

    const updatedOrder = await this.prisma.orders.update({
      where: { id },
      data: {
        order_status: updateOrderDto.order_status,
        shipping_address: updateOrderDto.shipping_address,
        shipping_rate:
          updateOrderDto.shipping_rate !== undefined
            ? updateOrderDto.shipping_rate.toFixed(2)
            : undefined,
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
      throw new NotFoundException(
        `Order with ID ${id} does not belong to user`,
      );
    }

    const hasNonStoreProduct = order.order_items.some(
      (item) => !item.product.is_store_product,
    );
    if (hasNonStoreProduct) {
      throw new NotFoundException(
        `Order with ID ${id} contains non-store products`,
      );
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
            throw new BadRequestException(
              `Invalid stock value for product ID ${item.product_id}`,
            );
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
