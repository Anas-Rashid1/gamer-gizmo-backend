// import { IsDateString, IsOptional,IsString } from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

// // export class AnalyticsQueryDto {
// //   @IsOptional()
// //   @IsDateString()
// //   startDate?: string;

// //   @IsOptional()
// //   @IsDateString()
// //   endDate?: string;
// // }

// export class AnalyticsQueryDto {
//   @IsOptional()
//   @IsDateString()
//   startDate?: string;

// @IsOptional()
//   @IsDateString()
//   endDate: string;

//   @ApiProperty({ description: 'Product ID to filter by', required: false, example: '101' })
//   @IsOptional()
//   @IsString()
//   productId?: string;
// }
// export class DailyAnalyticsResponseDto {
//   date: string;
//   signups: number;
//   visitors: number;
// }

// export class LocationDto {
//   id: number;
//   name: string;
//   productCount: number;
// }


// export class OrderAnalyticsResponseDto {
//   @ApiProperty({ description: 'Total cost of all orders', example: 10000 })
//   totalCost: number;

//   @ApiProperty({ description: 'Total sales across all time', example: 50000 })
//   totalSalesOverall: number;

//   @ApiProperty({ description: 'Total sales in the specified period', example: 8000 })
//   totalSalesInPeriod: number;

//   @ApiProperty({
//     description: 'List of orders with their details',
//     type: 'array',
//     items: {
//       type: 'object',
//       properties: {
//         orderId: { type: 'number', description: 'Order ID', example: 1 },
//         cost: { type: 'number', description: 'Order cost', example: 1000 },
//         salesPercentage: { type: 'number', description: 'Percentage of total sales', example: 12.5 },
//         createdAt: { type: 'string', description: 'Order creation date', example: '2025-05-15T10:00:00Z' },
//       },
//     },
//   })
//   orders: {
//     orderId: number;
//     cost: number;
//     salesPercentage: number;
//     createdAt: string;
//   }[];

//   @ApiProperty({
//     description: 'List of products with their sales details',
//     type: 'array',
//     items: {
//       type: 'object',
//       properties: {
//         productId: { type: 'number', description: 'Product ID', example: 101 },
//         productName: { type: 'string', description: 'Product name', example: 'Widget A' },
//         costInPeriod: { type: 'number', description: 'Sales cost in period', example: 800 },
//         salesPercentageInPeriod: { type: 'number', description: 'Percentage of sales in period', example: 10 },
//         costOverall: { type: 'number', description: 'Total sales cost overall', example: 5000 },
//         salesPercentageOverall: { type: 'number', description: 'Percentage of total sales overall', example: 10 },
//       },
//     },
//   })
//   products: {
//     productId: number;
//     productName: string;
//     costInPeriod: number;
//     salesPercentageInPeriod: number;
//     costOverall: number;
//     salesPercentageOverall: number;
//   }[];
// }


import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiProperty({ description: 'Start date in YYYY-MM-DD format', required: false, example: '2025-05-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date in YYYY-MM-DD format', required: false, example: '2025-06-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Product ID to filter by', required: false, example: '101' })
  @IsOptional()
  @IsString()
  productId?: string;
}

export class DailyAnalyticsResponseDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format', example: '2025-06-05' })
  date: string;

  @ApiProperty({ description: 'Number of user signups', example: 10 })
  signups: number;

  @ApiProperty({ description: 'Number of visitors', example: 100 })
  visitors: number;
}

export class LocationDto {
  @ApiProperty({ description: 'Location ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Location name', example: 'Dubai' })
  name: string;

  @ApiProperty({ description: 'Number of products in this location', example: 50 })
  productCount: number;
}

export class OrderAnalyticsResponseDto {
  @ApiProperty({ description: 'Total cost of all orders', example: 10000 })
  totalCost: number;

  @ApiProperty({ description: 'Total sales across all time', example: 50000 })
  totalSalesOverall: number;

  @ApiProperty({ description: 'Total sales in the specified period', example: 8000 })
  totalSalesInPeriod: number;

  @ApiProperty({
    description: 'List of orders with their details',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        orderId: { type: 'number', description: 'Order ID', example: 1 },
        cost: { type: 'number', description: 'Order cost', example: 1000 },
        salesPercentage: { type: 'number', description: 'Percentage of total sales', example: 12.5 },
        createdAt: { type: 'string', description: 'Order creation date', example: '2025-05-15T10:00:00Z' },
      },
    },
  })
  orders: {
    orderId: number;
    cost: number;
    salesPercentage: number;
    createdAt: string;
  }[];

  @ApiProperty({
    description: 'List of products with their sales details',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        productId: { type: 'number', description: 'Product ID', example: 101 },
        productName: { type: 'string', description: 'Product name', example: 'Widget A' },
        costInPeriod: { type: 'number', description: 'Sales cost in period', example: 800 },
        salesPercentageInPeriod: { type: 'number', description: 'Percentage of sales in period', example: 10 },
        costOverall: { type: 'number', description: 'Total sales cost overall', example: 5000 },
        salesPercentageOverall: { type: 'number', description: 'Percentage of total sales overall', example: 10 },
      },
    },
  })
  products: {
    productId: number;
    productName: string;
    costInPeriod: number;
    salesPercentageInPeriod: number;
    costOverall: number;
    salesPercentageOverall: number;
  }[];
}