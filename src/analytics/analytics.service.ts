// import { Injectable, Logger ,InternalServerErrorException} from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { AnalyticsQueryDto, DailyAnalyticsResponseDto, LocationDto,OrderAnalyticsResponseDto } from './dto/analytics.dto';

// @Injectable()
// export class AnalyticsService {
//   private readonly logger = new Logger(AnalyticsService.name);

//   constructor(private prisma: PrismaService) {}

//   async getDailyAnalytics(query: AnalyticsQueryDto): Promise<DailyAnalyticsResponseDto[]> {
//     try {
//       const { startDate, endDate } = query;

//       // Define date range (default to last 30 days if not provided)
//       const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//       const end = endDate ? new Date(endDate) : new Date();

//       // Query for daily signups, cast date to string
//       const signupQuery = `
//         SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as signups
//         FROM users
//         WHERE created_at >= $1 AND created_at <= $2
//         GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
//         ORDER BY date;
//       `;

//       // Query for daily visitors, cast date to string
//       const visitorQuery = `
//         SELECT TO_CHAR(visited_at, 'YYYY-MM-DD') as date, COUNT(*) as visitors
//         FROM visitors
//         WHERE visited_at >= $1 AND visited_at <= $2
//         GROUP BY TO_CHAR(visited_at, 'YYYY-MM-DD')
//         ORDER BY date;
//       `;

//       // Execute queries
//       const signups = await this.prisma.$queryRawUnsafe<
//         { date: string; signups: number }[]
//       >(signupQuery, start, end);

//       const visitors = await this.prisma.$queryRawUnsafe<
//         { date: string; visitors: number }[]
//       >(visitorQuery, start, end);

//       // Merge results
//       const dateMap = new Map<string, DailyAnalyticsResponseDto>();

//       // Initialize map with all dates in range
//       const currentDate = new Date(start);
//       while (currentDate <= end) {
//         const dateStr = currentDate.toISOString().split('T')[0];
//         dateMap.set(dateStr, { date: dateStr, signups: 0, visitors: 0 });
//         currentDate.setDate(currentDate.getDate() + 1);
//       }

//       // Populate signups
//       signups.forEach((signup) => {
//         const dateStr = signup.date;
//         if (dateMap.has(dateStr)) {
//           dateMap.get(dateStr)!.signups = Number(signup.signups);
//         }
//       });

//       // Populate visitors
//       visitors.forEach((visitor) => {
//         const dateStr = visitor.date;
//         if (dateMap.has(dateStr)) {
//           dateMap.get(dateStr)!.visitors = Number(visitor.visitors);
//         }
//       });

//       this.logger.log(`Fetched daily analytics from ${start.toISOString()} to ${end.toISOString()}`);
//       return Array.from(dateMap.values());
//     } catch (error) {
//       this.logger.error(`Failed to fetch daily analytics: ${error.message}`);
//       throw new Error(`Failed to fetch analytics: ${error.message}`);
//     }
//   }

//   async getLocations(): Promise<LocationDto[]> {
//     try {
//       const locations = await this.prisma.location.findMany({
//         select: {
//           id: true,
//           name: true,
//           _count: {
//             select: {
//               product_product_locationTolocation: true,
//             },
//           },
//         },
//         orderBy: {
//           product_product_locationTolocation: {
//             _count: 'desc',
//           },
//         },
//       });

//       const result: LocationDto[] = locations.map((location) => ({
//         id: location.id,
//         name: location.name,
//         productCount: location._count.product_product_locationTolocation,
//       }));

//       this.logger.log(`Fetched ${locations.length} locations sorted by product count`);
//       return result;
//     } catch (error) {
//       this.logger.error(`Failed to fetch locations: ${error.message}`);
//       throw new Error(`Failed to fetch locations: ${error.message}`);
//     }
//   }

//   async trackVisitor(ipAddress: string): Promise<void> {
//     try {
//       await this.prisma.visitors.create({
//         data: {
//           visited_at: new Date(),
//           ip_address: ipAddress,
//         },
//       });
//       this.logger.log(`Tracked visitor with IP ${ipAddress}`);
//     } catch (error) {
//       this.logger.error(`Failed to track visitor: ${error.message}`);
//       throw new Error(`Failed to track visitor: ${error.message}`);
//     }
//   }
  
//   async getOrderAnalytics(query: AnalyticsQueryDto): Promise<OrderAnalyticsResponseDto> {
//     try {
//       const { startDate, endDate, productId } = query;

//       // Convert dates to Date objects
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       end.setHours(23, 59, 59, 999); // Include entire end date

//       // Base where clause for orders
//       const whereOrders = {
//         created_at: {
//           gte: start,
//           lte: end,
//         },
//         order_items: {
//           some: {
//             product: {
//               is_store_product: true,
//             },
//             ...(productId ? { product_id: parseInt(productId, 10) } : {}),
//           },
//         },
//       };

//       // Fetch orders in the period
//       const ordersInPeriod = await this.prisma.orders.findMany({
//         where: whereOrders,
//         select: {
//           id: true,
//           created_at: true,
//           order_items: {
//             select: {
//               quantity: true,
//               price: true,
//               product: {
//                 select: {
//                   id: true,
//                   name: true,
//                 },
//               },
//             },
//           },
//         },
//       });

//       // Calculate total sales in period
//       let totalSalesInPeriod = 0;
//       const orderDetails = ordersInPeriod.map((order) => {
//         const cost = order.order_items.reduce(
//           (sum, item) => sum + item.quantity * parseFloat(item.price),
//           0,
//         );
//         totalSalesInPeriod += cost;
//         return {
//           orderId: order.id,
//           cost,
//           salesPercentage: 0, // To be calculated later
//           createdAt: order.created_at.toISOString(),
//         };
//       });

//       // Fetch total sales overall (no date filter, only store products)
//       const allOrders = await this.prisma.orders.findMany({
//         where: {
//           order_items: {
//             some: {
//               product: {
//                 is_store_product: true,
//               },
//               ...(productId ? { product_id: parseInt(productId, 10) } : {}),
//             },
//           },
//         },
//         select: {
//           order_items: {
//             select: {
//               quantity: true,
//               price: true,
//             },
//           },
//         },
//       });

//       const totalSalesOverall = allOrders.reduce(
//         (sum, order) =>
//           sum +
//           order.order_items.reduce(
//             (orderSum, item) => orderSum + item.quantity * parseFloat(item.price),
//             0,
//           ),
//         0,
//       );

//       // Aggregate product sales
//       const productSalesMap: Record<
//         number,
//         {
//           productId: number;
//           productName: string;
//           costInPeriod: number;
//           costOverall: number;
//         }
//       > = {};

//       // Process period sales
//       ordersInPeriod.forEach((order) => {
//         order.order_items.forEach((item) => {
//           if (!productId || item.product.id === parseInt(productId, 10)) {
//             if (!productSalesMap[item.product.id]) {
//               productSalesMap[item.product.id] = {
//                 productId: item.product.id,
//                 productName: item.product.name,
//                 costInPeriod: 0,
//                 costOverall: 0,
//               };
//             }
//             productSalesMap[item.product.id].costInPeriod +=
//               item.quantity * parseFloat(item.price);
//           }
//         });
//       });

//       // Process overall sales
//       const allOrderItems = await this.prisma.order_items.findMany({
//         where: {
//           product: {
//             is_store_product: true,
//           },
//           ...(productId ? { product_id: parseInt(productId, 10) } : {}),
//         },
//         select: {
//           quantity: true,
//           price: true,
//           product: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//         },
//       });

//       allOrderItems.forEach((item) => {
//         if (!productSalesMap[item.product.id]) {
//           productSalesMap[item.product.id] = {
//             productId: item.product.id,
//             productName: item.product.name,
//             costInPeriod: 0,
//             costOverall: 0,
//           };
//         }
//         productSalesMap[item.product.id].costOverall +=
//           item.quantity * parseFloat(item.price);
//       });

//       // Calculate percentages
//       const products = Object.values(productSalesMap).map((product) => ({
//         productId: product.productId,
//         productName: product.productName,
//         costInPeriod: product.costInPeriod,
//         salesPercentageInPeriod: totalSalesInPeriod
//           ? (product.costInPeriod / totalSalesInPeriod) * 100
//           : 0,
//         costOverall: product.costOverall,
//         salesPercentageOverall: totalSalesOverall
//           ? (product.costOverall / totalSalesOverall) * 100
//           : 0,
//       }));

//       // Update order sales percentages
//       const orders = orderDetails.map((order) => ({
//         ...order,
//         salesPercentage: totalSalesInPeriod ? (order.cost / totalSalesInPeriod) * 100 : 0,
//       }));

//       return {
//         totalCost: totalSalesInPeriod, // Assuming totalCost is same as totalSalesInPeriod
//         totalSalesOverall,
//         totalSalesInPeriod,
//         orders,
//         products,
//       };
//     } catch (error) {
//       throw new InternalServerErrorException('Failed to fetch order analytics', error.message);
//     }
//   }
// }

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto, DailyAnalyticsResponseDto, LocationDto, OrderAnalyticsResponseDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDailyAnalytics(query: AnalyticsQueryDto): Promise<DailyAnalyticsResponseDto[]> {
    try {
      const { startDate, endDate } = query;

      // Define date range (default to last 30 days if not provided)
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999); // Include entire end date

      // Query for daily signups
      const signupQuery = `
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as signups
        FROM users
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date;
      `;

      // Query for daily visitors
      const visitorQuery = `
        SELECT TO_CHAR(visited_at, 'YYYY-MM-DD') as date, COUNT(*) as visitors
        FROM visitors
        WHERE visited_at >= $1 AND visited_at <= $2
        GROUP BY TO_CHAR(visited_at, 'YYYY-MM-DD')
        ORDER BY date;
      `;

      // Execute queries
      const signups = await this.prisma.$queryRawUnsafe<
        { date: string; signups: bigint }[]
      >(signupQuery, start, end);

      const visitors = await this.prisma.$queryRawUnsafe<
        { date: string; visitors: bigint }[]
      >(visitorQuery, start, end);

      // Merge results
      const dateMap = new Map<string, DailyAnalyticsResponseDto>();

      // Initialize map with all dates in range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dateMap.set(dateStr, { date: dateStr, signups: 0, visitors: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Populate signups
      signups.forEach((signup) => {
        const dateStr = signup.date;
        if (dateMap.has(dateStr)) {
          dateMap.get(dateStr)!.signups = Number(signup.signups);
        }
      });

      // Populate visitors
      visitors.forEach((visitor) => {
        const dateStr = visitor.date;
        if (dateMap.has(dateStr)) {
          dateMap.get(dateStr)!.visitors = Number(visitor.visitors);
        }
      });

      this.logger.log(`Fetched daily analytics from ${start.toISOString()} to ${end.toISOString()}`);
      return Array.from(dateMap.values());
    } catch (error) {
      this.logger.error(`Failed to fetch daily analytics: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch daily analytics', error.message);
    }
  }

  async getLocations(): Promise<LocationDto[]> {
    try {
      const locations = await this.prisma.location.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              product_product_locationTolocation: true,
            },
          },
        },
        orderBy: {
          product_product_locationTolocation: {
            _count: 'desc',
          },
        },
      });

      const result: LocationDto[] = locations.map((location) => ({
        id: location.id,
        name: location.name,
        productCount: location._count.product_product_locationTolocation,
      }));

      this.logger.log(`Fetched ${locations.length} locations sorted by product count`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch locations: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch locations', error.message);
    }
  }

  async trackVisitor(ipAddress: string): Promise<void> {
    try {
      await this.prisma.visitors.create({
        data: {
          visited_at: new Date(),
          ip_address: ipAddress,
        },
      });
      this.logger.log(`Tracked visitor with IP ${ipAddress}`);
    } catch (error) {
      this.logger.error(`Failed to track visitor: ${error.message}`);
      throw new InternalServerErrorException('Failed to track visitor', error.message);
    }
  }

  // async getOrderAnalytics(query: AnalyticsQueryDto): Promise<OrderAnalyticsResponseDto> {
  //   try {
  //     const { startDate, endDate, productId } = query;

  //     // Convert dates to Date objects
  //     const start = new Date(startDate);
  //     const end = new Date(endDate);
  //     end.setHours(23, 59, 59, 999); // Include entire end date

  //     // Base where clause for orders
  //     const whereOrders = {
  //       created_at: {
  //         gte: start,
  //         lte: end,
  //       },
  //       order_items: {
  //         some: {
  //           product: {
  //             is_store_product: true,
  //           },
  //           ...(productId ? { product_id: parseInt(productId, 10) } : {}),
  //         },
  //       },
  //     };

  //     // Fetch orders in the period
  //     const ordersInPeriod = await this.prisma.orders.findMany({
  //       where: whereOrders,
  //       select: {
  //         id: true,
  //         created_at: true,
  //         order_items: {
  //           select: {
  //             quantity: true,
  //             price: true,
  //             product: {
  //               select: {
  //                 id: true,
  //                 name: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });

  //     // Calculate total sales in period
  //     let totalSalesInPeriod = 0;
  //     const orderDetails = ordersInPeriod.map((order) => {
  //       const cost = order.order_items.reduce(
  //         (sum, item) => sum + item.quantity * parseFloat(item.price),
  //         0,
  //       );
  //       totalSalesInPeriod += cost;
  //       return {
  //         orderId: order.id,
  //         cost,
  //         salesPercentage: 0, // To be calculated later
  //         createdAt: order.created_at.toISOString(),
  //       };
  //     });

  //     // Fetch total sales overall (no date filter, only store products)
  //     const allOrders = await this.prisma.orders.findMany({
  //       where: {
  //         order_items: {
  //           some: {
  //             product: {
  //               is_store_product: true,
  //             },
  //             ...(productId ? { product_id: parseInt(productId, 10) } : {}),
  //           },
  //         },
  //       },
  //       select: {
  //         order_items: {
  //           select: {
  //             quantity: true,
  //             price: true,
  //           },
  //         },
  //       },
  //     });

  //     const totalSalesOverall = allOrders.reduce(
  //       (sum, order) =>
  //         sum +
  //         order.order_items.reduce(
  //           (orderSum, item) => orderSum + item.quantity * parseFloat(item.price),
  //           0,
  //         ),
  //       0,
  //     );

  //     // Aggregate product sales
  //     const productSalesMap: Record<
  //       number,
  //       {
  //         productId: number;
  //         productName: string;
  //         costInPeriod: number;
  //         costOverall: number;
  //       }
  //     > = {};

  //     // Process period sales
  //     ordersInPeriod.forEach((order) => {
  //       order.order_items.forEach((item) => {
  //         if (!productId || item.product.id === parseInt(productId, 10)) {
  //           if (!productSalesMap[item.product.id]) {
  //             productSalesMap[item.product.id] = {
  //               productId: item.product.id,
  //               productName: item.product.name,
  //               costInPeriod: 0,
  //               costOverall: 0,
  //             };
  //           }
  //           productSalesMap[item.product.id].costInPeriod +=
  //             item.quantity * parseFloat(item.price);
  //         }
  //       });
  //     });

  //     // Process overall sales
  //     const allOrderItems = await this.prisma.order_items.findMany({
  //       where: {
  //         product: {
  //           is_store_product: true,
  //         },
  //         ...(productId ? { product_id: parseInt(productId, 10) } : {}),
  //       },
  //       select: {
  //         quantity: true,
  //         price: true,
  //         product: {
  //           select: {
  //             id: true,
  //             name: true,
  //           },
  //         },
  //       },
  //     });

  //     allOrderItems.forEach((item) => {
  //       if (!productSalesMap[item.product.id]) {
  //         productSalesMap[item.product.id] = {
  //           productId: item.product.id,
  //           productName: item.product.name,
  //           costInPeriod: 0,
  //           costOverall: 0,
  //         };
  //       }
  //       productSalesMap[item.product.id].costOverall +=
  //         item.quantity * parseFloat(item.price);
  //     });

  //     // Calculate percentages
  //     const products = Object.values(productSalesMap).map((product) => ({
  //       productId: product.productId,
  //       productName: product.productName,
  //       costInPeriod: product.costInPeriod,
  //       salesPercentageInPeriod: totalSalesInPeriod
  //         ? (product.costInPeriod / totalSalesInPeriod) * 100
  //         : 0,
  //       costOverall: product.costOverall,
  //       salesPercentageOverall: totalSalesOverall
  //         ? (product.costOverall / totalSalesOverall) * 100
  //         : 0,
  //     }));

  //     // Update order sales percentages
  //     const orders = orderDetails.map((order) => ({
  //       ...order,
  //       salesPercentage: totalSalesInPeriod ? (order.cost / totalSalesInPeriod) * 100 : 0,
  //     }));

  //     return {
  //       totalCost: totalSalesInPeriod, // Assuming totalCost is same as totalSalesInPeriod
  //       totalSalesOverall,
  //       totalSalesInPeriod,
  //       orders,
  //       products,
  //     };
  //   } catch (error) {
  //     throw new InternalServerErrorException('Failed to fetch order analytics', error.message);
  //   }
  // }
  async getOrderAnalytics(query: AnalyticsQueryDto): Promise<OrderAnalyticsResponseDto> {
  try {
    const { startDate, endDate, productId } = query;

    // Convert dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end date

    // Base where clause for orders
    const whereOrders = {
      created_at: {
        gte: start,
        lte: end,
      },
      order_items: {
        some: {
          product_id: { not: null }, // Ensure product_id is not null
          product: {
            is_store_product: true,
          },
          ...(productId ? { product_id: parseInt(productId, 10) } : {}),
        },
      },
    };

    // Fetch orders in the period
    const ordersInPeriod = await this.prisma.orders.findMany({
      where: whereOrders,
      select: {
        id: true,
        created_at: true,
        order_items: {
          select: {
            quantity: true,
            price: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          where: {
            product_id: { not: null }, // Ensure product_id is not null
          },
        },
      },
    });

    // Calculate total sales in period
    let totalSalesInPeriod = 0;
    const orderDetails = ordersInPeriod.map((order) => {
      const cost = order.order_items.reduce(
        (sum, item) => sum + item.quantity * parseFloat(item.price),
        0,
      );
      totalSalesInPeriod += cost;
      return {
        orderId: order.id,
        cost,
        salesPercentage: 0, // To be calculated later
        createdAt: order.created_at.toISOString(),
      };
    });

    // Fetch total sales overall (no date filter, only store products)
    const allOrderItems = await this.prisma.order_items.findMany({
      where: {
        product_id: { not: null }, // Ensure product_id is not null
        product: {
          is_store_product: true,
        },
        ...(productId ? { product_id: parseInt(productId, 10) } : {}),
      },
      select: {
        quantity: true,
        price: true,
      },
    });

    const totalSalesOverall = allOrderItems.reduce(
      (sum, item) => sum + item.quantity * parseFloat(item.price),
      0,
    );

    // Aggregate product sales
    const productSalesMap: Record<
      number,
      {
        productId: number;
        productName: string;
        costInPeriod: number;
        costOverall: number;
      }
    > = {};

    // Process period sales
    ordersInPeriod.forEach((order) => {
      order.order_items.forEach((item) => {
        // Skip if product is null
        if (!item.product) {
          this.logger.warn(`Skipping order_item with null product in order ${order.id}`);
          return;
        }
        if (!productId || item.product.id === parseInt(productId, 10)) {
          if (!productSalesMap[item.product.id]) {
            productSalesMap[item.product.id] = {
              productId: item.product.id,
              productName: item.product.name,
              costInPeriod: 0,
              costOverall: 0,
            };
          }
          productSalesMap[item.product.id].costInPeriod +=
            item.quantity * parseFloat(item.price);
        }
      });
    });

    // Process overall sales
    const allOrderItemsWithProduct = await this.prisma.order_items.findMany({
      where: {
        product_id: { not: null }, // Ensure product_id is not null
        product: {
          is_store_product: true,
        },
        ...(productId ? { product_id: parseInt(productId, 10) } : {}),
      },
      select: {
        quantity: true,
        price: true,
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    allOrderItemsWithProduct.forEach((item) => {
      // Skip if product is null (shouldn't happen due to where clause)
      if (!item.product) {
        this.logger.warn(`Skipping order_item with null product in overall sales`);
        return;
      }
      if (!productSalesMap[item.product.id]) {
        productSalesMap[item.product.id] = {
          productId: item.product.id,
          productName: item.product.name,
          costInPeriod: 0,
          costOverall: 0,
        };
      }
      productSalesMap[item.product.id].costOverall +=
        item.quantity * parseFloat(item.price);
    });

    // Calculate percentages
    const products = Object.values(productSalesMap).map((product) => ({
      productId: product.productId,
      productName: product.productName,
      costInPeriod: product.costInPeriod,
      salesPercentageInPeriod: totalSalesInPeriod
        ? (product.costInPeriod / totalSalesInPeriod) * 100
        : 0,
      costOverall: product.costOverall,
      salesPercentageOverall: totalSalesOverall
        ? (product.costOverall / totalSalesOverall) * 100
        : 0,
    }));

    // Update order sales percentages
    const orders = orderDetails.map((order) => ({
      ...order,
      salesPercentage: totalSalesInPeriod ? (order.cost / totalSalesInPeriod) * 100 : 0,
    }));

    return {
      totalCost: totalSalesInPeriod,
      totalSalesOverall,
      totalSalesInPeriod,
      orders,
      products,
    };
  } catch (error) {
    this.logger.error(`Failed to fetch order analytics: ${error.message}`);
    throw new InternalServerErrorException('Failed to fetch order analytics', error.message);
  }
}
}