// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderDto } from './dto/update-order.dto';

// @Injectable()
// export class OrderService {
//   constructor(private prisma: PrismaService) {}

//   async create(createOrderDto: CreateOrderDto) {
//     const { user_id, shipping_address, order_items } = createOrderDto;

//     // Validate stock and calculate total_amount, caching product data
//     let totalAmount = 0;
//     const productCache: { [key: number]: { price: string; stock: string } } = {};

//     for (const item of order_items) {
//       const product = await this.prisma.product.findUnique({
//         where: { id: item.product_id },
//       });

//       if (!product) {
//         throw new NotFoundException(`Product with ID ${item.product_id} not found`);
//       }

//       const currentStock = parseInt(product.stock, 10);
//       if (isNaN(currentStock) || currentStock < item.quantity) {
//         throw new BadRequestException(
//           `Insufficient stock for product ID ${item.product_id}. Available: ${product.stock}, Requested: ${item.quantity}`,
//         );
//       }

//       const itemPrice = parseFloat(product.price);
//       if (isNaN(itemPrice)) {
//         throw new BadRequestException(`Invalid price for product ID ${item.product_id}`);
//       }

//       productCache[item.product_id] = { price: product.price, stock: product.stock };
//       totalAmount += itemPrice * item.quantity;
//     }

//     // Create the order and update stock in a transaction
//     return this.prisma.$transaction(async (prisma) => {
//       // Create the order
//       const order = await prisma.orders.create({
//         data: {
//           user_id,
//           total_amount: totalAmount.toFixed(2), // Convert to string with 2 decimal places
//           shipping_address,
//           order_status: 'PENDING',
//           order_items: {
//             create: order_items.map(item => ({
//               product_id: item.product_id,
//               quantity: item.quantity,
//               price: productCache[item.product_id].price, // Use cached price
//             })),
//           },
//         },
//         include: {
//           order_items: true,
//           users: true,
//         },
//       });

//       // Update stock for each product
//       for (const item of order_items) {
//         const newStock = parseInt(productCache[item.product_id].stock, 10) - item.quantity;
//         await prisma.product.update({
//           where: { id: item.product_id },
//           data: { stock: newStock.toString() },
//         });
//       }

//       return order;
//     });
//   }

//   async findAll() {
//     return this.prisma.orders.findMany({
//       include: {
//         order_items: {
//           include: {
//             product: true,
//           },
//         },
//         users: true,
//         transactions: true,
//       },
//     });
//   }

//   async findOne(id: number) {
//     const order = await this.prisma.orders.findUnique({
//       where: { id },
//       include: {
//         order_items: {
//           include: {
//             product: true,
//           },
//         },
//         users: true,
//         transactions: true,
//       },
//     });

//     if (!order) {
//       throw new NotFoundException(`Order with ID ${id} not found`);
//     }

//     return order;
//   }

//   async update(id: number, updateOrderDto: UpdateOrderDto) {
//     const order = await this.prisma.orders.findUnique({ where: { id } });
//     if (!order) {
//       throw new NotFoundException(`Order with ID ${id} not found`);
//     }

//     return this.prisma.orders.update({
//       where: { id },
//       data: {
//         order_status: updateOrderDto.order_status,
//         shipping_address: updateOrderDto.shipping_address,
//         updated_at: new Date(),
//       },
//       include: {
//         order_items: true,
//         users: true,
//         transactions: true,
//       },
//     });
//   }

//   async remove(id: number) {
//     const order = await this.prisma.orders.findUnique({
//       where: { id },
//       include: { order_items: true },
//     });
//     if (!order) {
//       throw new NotFoundException(`Order with ID ${id} not found`);
//     }

//     // Delete the order and restore stock in a transaction
//     return this.prisma.$transaction(async (prisma) => {
//       // Delete related order_items first
//       await prisma.order_items.deleteMany({
//         where: { order_id: id },
//       });

//       // Delete the order
//       const deletedOrder = await prisma.orders.delete({
//         where: { id },
//         include: { order_items: true },
//       });

//       // Restore stock for each product in the order
//       for (const item of order.order_items) {
//         const product = await prisma.product.findUnique({
//           where: { id: item.product_id },
//         });
//         if (product) {
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

//       return deletedOrder;
//     });
//   }
// }

// import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderDto } from './dto/update-order.dto';

// @Injectable()
// export class OrderService {
//   constructor(private prisma: PrismaService) {}

//   async create(createOrderDto: CreateOrderDto) {
//     const { user_id, shipping_address, order_items } = createOrderDto;

//     // Validate user existence
//     const user = await this.prisma.users.findUnique({ where: { id: user_id } });
//     if (!user) {
//       throw new NotFoundException(`User with ID ${user_id} not found`);
//     }

//     // Fetch all products in one query
//     const productIds = order_items.map(item => item.product_id);
//     const products = await this.prisma.product.findMany({
//       where: { id: { in: productIds } },
//     });
//     const productMap = new Map(products.map(p => [p.id, p]));

//     // Validate stock, store product, and calculate total_amount
//     let totalAmount = 0;
//     for (const item of order_items) {
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
//           order_items: {
//             create: order_items.map(item => ({
//               product_id: item.product_id,
//               quantity: item.quantity,
//               price: productMap.get(item.product_id).price,
//             })),
//           },
//         },
//         include: {
//           order_items: true,
//           users: true,
//         },
//       });

//       for (const item of order_items) {
//         const product = productMap.get(item.product_id);
//         const newStock = parseInt(product.stock, 10) - item.quantity;
//         await prisma.product.update({
//           where: { id: item.product_id },
//           data: { stock: newStock.toString() },
//         });
//       }

//       return order;
//     });
//   }

//   async findAll() {
//     return this.prisma.orders.findMany({
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
//             product: true,
//           },
//         },
//         users: true,
//         transactions: true,
//       },
//     });
//   }

//   async findOne(id: number) {
//     const order = await this.prisma.orders.findUnique({
//       where: { id },
//       include: {
//         order_items: {
//           include: {
//             product: true,
//           },
//         },
//         users: true,
//         transactions: true,
//       },
//     });

//     if (!order) {
//       throw new NotFoundException(`Order with ID ${id} not found`);
//     }

//     // Verify all order_items are linked to store products
//     const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
//     if (hasNonStoreProduct) {
//       throw new NotFoundException(`Order with ID ${id} contains non-store products`);
//     }

//     return order;
//   }

//   async update(id: number, updateOrderDto: UpdateOrderDto) {
//     const order = await this.prisma.orders.findUnique({
//       where: { id },
//       include: {
//         order_items: {
//           include: {
//             product: true,
//           },
//         },
//       },
//     });
//     if (!order) {
//       throw new NotFoundException(`Order with ID ${id} not found`);
//     }

//     // Verify all order_items are linked to store products
//     const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
//     if (hasNonStoreProduct) {
//       throw new NotFoundException(`Order with ID ${id} contains non-store products`);
//     }

//     return this.prisma.orders.update({
//       where: { id },
//       data: {
//         order_status: updateOrderDto.order_status,
//         shipping_address: updateOrderDto.shipping_address,
//         updated_at: new Date(),
//       },
//       include: {
//         order_items: true,
//         users: true,
//         transactions: true,
//       },
//     });
//   }

//   async remove(id: number) {
//     const order = await this.prisma.orders.findUnique({
//       where: { id },
//       include: { order_items: { include: { product: true } }, transactions: true },
//     });
//     if (!order) {
//       throw new NotFoundException(`Order with ID ${id} not found`);
//     }

//     // Verify all order_items are linked to store products
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
//         include: { order_items: true, transactions: true },
//       });

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

//       return deletedOrder;
//     });
//   }
// }

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, user: any) {
    const { shipping_address, order_items } = createOrderDto;
    const user_id = user.id;

    // Validate user existence
    const userRecord = await this.prisma.users.findUnique({ where: { id: user_id } });
    if (!userRecord) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    // Fetch all products in one query
    const productIds = order_items.map(item => item.product_id);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    // Validate stock, store product, and calculate total_amount
    let totalAmount = 0;
    for (const item of order_items) {
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
          `Insufficient stock for product ID ${item.product_id}. Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }

      const itemPrice = parseFloat(product.price);
      if (isNaN(itemPrice)) {
        throw new BadRequestException(`Invalid price for product ID ${item.product_id}`);
      }

      totalAmount += itemPrice * item.quantity;
    }

    // Create the order and update stock in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.orders.create({
        data: {
          user_id,
          total_amount: totalAmount.toFixed(2),
          shipping_address,
          order_status: 'PENDING',
          order_items: {
            create: order_items.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: productMap.get(item.product_id).price,
            })),
          },
        },
        include: {
          order_items: true,
          users: true,
        },
      });

      for (const item of order_items) {
        const product = productMap.get(item.product_id);
        const newStock = parseInt(product.stock, 10) - item.quantity;
        await prisma.product.update({
          where: { id: item.product_id },
          data: { stock: newStock.toString() },
        });
      }

      return order;
    });
  }

  async findAll() {
    return this.prisma.orders.findMany({
      where: {
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
            product: true,
          },
        },
        users: true,
        transactions: true,
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        order_items: {
          include: {
            product: true,
          },
        },
        users: true,
        transactions: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Verify all order_items are linked to store products
    const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
    if (hasNonStoreProduct) {
      throw new NotFoundException(`Order with ID ${id} contains non-store products`);
    }

    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: {
        order_items: {
          include: {
            product: true,
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Verify all order_items are linked to store products
    const hasNonStoreProduct = order.order_items.some(item => !item.product.is_store_product);
    if (hasNonStoreProduct) {
      throw new NotFoundException(`Order with ID ${id} contains non-store products`);
    }

    return this.prisma.orders.update({
      where: { id },
      data: {
        order_status: updateOrderDto.order_status,
        shipping_address: updateOrderDto.shipping_address,
        updated_at: new Date(),
      },
      include: {
        order_items: true,
        users: true,
        transactions: true,
      },
    });
  }

  async remove(id: number) {
    const order = await this.prisma.orders.findUnique({
      where: { id },
      include: { order_items: { include: { product: true } }, transactions: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Verify all order_items are linked to store products
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
        include: { order_items: true, transactions: true },
      });

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

      return deletedOrder;
    });
  }
}