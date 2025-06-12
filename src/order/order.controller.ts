import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.gurad';
import { Request } from 'express';

// Define JwtPayload interface locally
interface JwtPayload {
  id: number;
  [key: string]: any;
}

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(AuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a new order from cart items (store products only, authenticated user)',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully from cart items',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Order ID' },
        user_id: { type: 'number', description: 'User ID' },
        total_amount: {
          type: 'string',
          description: 'Total amount (including shipping)',
        },
        shipping_rate: { type: 'number', description: 'Shipping rate' },
        shipping_address: { type: 'string', description: 'Shipping address' },
        order_status: { type: 'string', description: 'Order status' },
        created_at: {
          type: 'string',
          format: 'date-time',
          description: 'Creation date',
        },
        updated_at: {
          type: 'string',
          format: 'date-time',
          description: 'Update date',
        },
        order_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Order item ID' },
              product_id: { type: 'number', description: 'Product ID' },
              quantity: { type: 'number', description: 'Quantity' },
              price: { type: 'string', description: 'Price' },
              created_at: {
                type: 'string',
                format: 'date-time',
                description: 'Creation date',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
                description: 'Update date',
              },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'number', description: 'Product ID' },
                  name: { type: 'string', description: 'Product name' },
                  price: { type: 'string', description: 'Product price' },
                  stock: { type: 'string', description: 'Product stock' },
                  is_store_product: {
                    type: 'boolean',
                    description: 'Is store product',
                  },
                  product_images: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', description: 'Image ID' },
                        image_url: {
                          type: 'string',
                          description: 'Signed S3 URL for the image',
                        },
                        created_at: {
                          type: 'string',
                          format: 'date-time',
                          description: 'Creation date',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        users: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'User ID' },
            username: { type: 'string', description: 'Username' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid input, insufficient stock, non-store product, or empty cart',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() request: Request & { user: JwtPayload },
  ) {
    return this.orderService.create(createOrderDto, request.user);
  }

  @Post('create-intent')
  createPaymentIntent(
    @Body() dto: CreateOrderDto,
    @Req() request: Request & { user: JwtPayload },
  ) {
    return this.orderService.createPaymentIntent(dto, request.user);
  }

  @Get()
  @ApiOperation({
    summary: "Retrieve authenticated user's orders (store products only)",
  })
  @ApiResponse({
    status: 200,
    description:
      "List of authenticated user's orders with store product items and signed image URLs",
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Order ID' },
          user_id: { type: 'number', description: 'User ID' },
          total_amount: {
            type: 'string',
            description: 'Total amount (including shipping)',
          },
          shipping_rate: { type: 'number', description: 'Shipping rate' },
          shipping_address: { type: 'string', description: 'Shipping address' },
          order_status: { type: 'string', description: 'Order status' },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation date',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Update date',
          },
          order_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', description: 'Order item ID' },
                product_id: { type: 'number', description: 'Product ID' },
                quantity: { type: 'number', description: 'Quantity' },
                price: { type: 'string', description: 'Price' },
                created_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Creation date',
                },
                updated_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Update date',
                },
                product: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', description: 'Product ID' },
                    name: { type: 'string', description: 'Product name' },
                    price: { type: 'string', description: 'Product price' },
                    stock: { type: 'string', description: 'Product stock' },
                    is_store_product: {
                      type: 'boolean',
                      description: 'Is store product',
                    },
                    product_images: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'number', description: 'Image ID' },
                          image_url: {
                            type: 'string',
                            description: 'Signed S3 URL for the image',
                          },
                          created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Creation date',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          users: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'User ID' },
              username: { type: 'string', description: 'Username' },
            },
          },
          transactions: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  findAll(@Req() request: Request & { user: JwtPayload }) {
    return this.orderService.findAll(request.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Retrieve a specific order by ID for authenticated user (store products only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description:
      'Order details for store products belonging to authenticated user',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Order ID' },
        user_id: { type: 'number', description: 'User ID' },
        total_amount: {
          type: 'string',
          description: 'Total amount (including shipping)',
        },
        shipping_rate: { type: 'number', description: 'Shipping rate' },
        shipping_address: { type: 'string', description: 'Shipping address' },
        order_status: { type: 'string', description: 'Order status' },
        created_at: {
          type: 'string',
          format: 'date-time',
          description: 'Creation date',
        },
        updated_at: {
          type: 'string',
          format: 'date-time',
          description: 'Update date',
        },
        order_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Order item ID' },
              product_id: { type: 'number', description: 'Product ID' },
              quantity: { type: 'number', description: 'Quantity' },
              price: { type: 'string', description: 'Price' },
              created_at: {
                type: 'string',
                format: 'date-time',
                description: 'Creation date',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
                description: 'Update date',
              },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'number', description: 'Product ID' },
                  name: { type: 'string', description: 'Product name' },
                  price: { type: 'string', description: 'Product price' },
                  stock: { type: 'string', description: 'Product stock' },
                  is_store_product: {
                    type: 'boolean',
                    description: 'Is store product',
                  },
                  product_images: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', description: 'Image ID' },
                        image_url: {
                          type: 'string',
                          description: 'Signed S3 URL for the image',
                        },
                        created_at: {
                          type: 'string',
                          format: 'date-time',
                          description: 'Creation date',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        users: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'User ID' },
            username: { type: 'string', description: 'Username' },
          },
        },
        transactions: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description:
      'Not Found - Order not found, not owned by user, or contains non-store products',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: JwtPayload },
  ) {
    return this.orderService.findOne(id, request.user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an order for authenticated user (store products only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Order updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Order ID' },
        user_id: { type: 'number', description: 'User ID' },
        total_amount: {
          type: 'string',
          description: 'Total amount (including shipping)',
        },
        shipping_rate: { type: 'number', description: 'Shipping rate' },
        shipping_address: { type: 'string', description: 'Shipping address' },
        order_status: { type: 'string', description: 'Order status' },
        created_at: {
          type: 'string',
          format: 'date-time',
          description: 'Creation date',
        },
        updated_at: {
          type: 'string',
          format: 'date-time',
          description: 'Update date',
        },
        order_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Order item ID' },
              product_id: { type: 'number', description: 'Product ID' },
              quantity: { type: 'number', description: 'Quantity' },
              price: { type: 'string', description: 'Price' },
              created_at: {
                type: 'string',
                format: 'date-time',
                description: 'Creation date',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
                description: 'Update date',
              },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'number', description: 'Product ID' },
                  name: { type: 'string', description: 'Product name' },
                  price: { type: 'string', description: 'Product price' },
                  stock: { type: 'string', description: 'Product stock' },
                  is_store_product: {
                    type: 'boolean',
                    description: 'Is store product',
                  },
                  product_images: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', description: 'Image ID' },
                        image_url: {
                          type: 'string',
                          description: 'Signed S3 URL for the image',
                        },
                        created_at: {
                          type: 'string',
                          format: 'date-time',
                          description: 'Creation date',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        users: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'User ID' },
            username: { type: 'string', description: 'Username' },
          },
        },
        transactions: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description:
      'Not Found - Order not found, not owned by user, or contains non-store products',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid ID format or input',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() request: Request & { user: JwtPayload },
  ) {
    return this.orderService.update(id, updateOrderDto, request.user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an order for authenticated user (store products only)',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order deleted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Order ID' },
        user_id: { type: 'number', description: 'User ID' },
        total_amount: {
          type: 'string',
          description: 'Total amount (including shipping)',
        },
        shipping_rate: { type: 'number', description: 'Shipping rate' },
        shipping_address: { type: 'string', description: 'Shipping address' },
        order_status: { type: 'string', description: 'Order status' },
        created_at: {
          type: 'string',
          format: 'date-time',
          description: 'Creation date',
        },
        updated_at: {
          type: 'string',
          format: 'date-time',
          description: 'Update date',
        },
        order_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Order item ID' },
              product_id: { type: 'number', description: 'Product ID' },
              quantity: { type: 'number', description: 'Quantity' },
              price: { type: 'string', description: 'Price' },
              created_at: {
                type: 'string',
                format: 'date-time',
                description: 'Creation date',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
                description: 'Update date',
              },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'number', description: 'Product ID' },
                  name: { type: 'string', description: 'Product name' },
                  price: { type: 'string', description: 'Product price' },
                  stock: { type: 'string', description: 'Product stock' },
                  is_store_product: {
                    type: 'boolean',
                    description: 'Is store product',
                  },
                  product_images: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', description: 'Image ID' },
                        image_url: {
                          type: 'string',
                          description: 'Signed S3 URL for the image',
                        },
                        created_at: {
                          type: 'string',
                          format: 'date-time',
                          description: 'Creation date',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        users: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'User ID' },
            username: { type: 'string', description: 'Username' },
          },
        },
        transactions: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description:
      'Not Found - Order not found, not owned by user, or contains non-store products',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: JwtPayload },
  ) {
    return this.orderService.remove(id, request.user.id);
  }
}

// import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
// import { OrderService } from './order.service';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderDto } from './dto/update-order.dto';
// import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
// import { AuthGuard } from '../auth/auth.gurad';
// import { Request } from 'express';

// // Define JwtPayload interface locally
// interface JwtPayload {
//   id: number;
//   [key: string]: any;
// }

// @ApiTags('Orders')
// @ApiBearerAuth()
// @Controller('orders')
// @UseGuards(AuthGuard)
// export class OrderController {
//   constructor(private readonly orderService: OrderService) {}

//   @Post()
//   @ApiOperation({ summary: 'Create a new order from cart items (store products only, authenticated user)' })
//   @ApiBody({ type: CreateOrderDto })
//   @ApiResponse({ status: 201, description: 'Order created successfully from cart items', type: Object })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid input, insufficient stock, non-store product, or empty cart' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   create(@Body() createOrderDto: CreateOrderDto, @Req() request: Request & { user: JwtPayload }) {
//     return this.orderService.create(createOrderDto, request.user);
//   }

//   @Get()
//   @ApiOperation({ summary: 'Retrieve all orders for store products (authenticated user)' })
//   @ApiResponse({ status: 200, description: 'List of orders with order_items linked to store products', type: [Object] })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   findAll() {
//     return this.orderService.findAll();
//   }

//   @Get(':id')
//   @ApiOperation({ summary: 'Retrieve a specific order by ID (store products only, authenticated user)' })
//   @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
//   @ApiResponse({ status: 200, description: 'Order details for store products', type: Object })
//   @ApiResponse({ status: 404, description: 'Not Found - Order not found or no store products' })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   findOne(@Param('id', ParseIntPipe) id: number) {
//     return this.orderService.findOne(id);
//   }

//   @Patch(':id')
//   @ApiOperation({ summary: 'Update an order (store products only, authenticated user)' })
//   @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
//   @ApiBody({ type: UpdateOrderDto })
//   @ApiResponse({ status: 200, description: 'Order updated successfully', type: Object })
//   @ApiResponse({ status: 404, description: 'Not Found - Order not found or no store products' })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format or input' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   update(@Param('id', ParseIntPipe) id: number, @Body() updateOrderDto: UpdateOrderDto) {
//     return this.orderService.update(id, updateOrderDto);
//   }

//   @Delete(':id')
//   @ApiOperation({ summary: 'Delete an order (store products only, authenticated user)' })
//   @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
//   @ApiResponse({ status: 200, description: 'Order deleted successfully', type: Object })
//   @ApiResponse({ status: 404, description: 'Not Found - Order not found or no store products' })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   remove(@Param('id', ParseIntPipe) id: number) {
//     return this.orderService.remove(id);
//   }
// }
