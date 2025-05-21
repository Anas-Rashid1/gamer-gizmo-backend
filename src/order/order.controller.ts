

// import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
// import { OrderService } from './order.service';
// import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderDto } from './dto/update-order.dto';
// import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
// import { AuthGuard } from '../auth/auth.gurad';
// import { Request } from 'express';

// @ApiTags('Orders')
// @ApiBearerAuth()
// @Controller('orders')
// @UseGuards(AuthGuard)
// export class OrderController {
//   constructor(private readonly orderService: OrderService) {}

//   @Post()
//   @ApiOperation({ summary: 'Create a new order (only for store products, authenticated user)' })
//   @ApiBody({ type: CreateOrderDto })
//   @ApiResponse({ status: 201, description: 'Order created successfully for store products', type: Object })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid input, insufficient stock, or non-store product' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   create(@Body() createOrderDto: CreateOrderDto, @Req() request: Request) {
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

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new order from cart items (store products only, authenticated user)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully from cart items', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input, insufficient stock, non-store product, or empty cart' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  create(@Body() createOrderDto: CreateOrderDto, @Req() request: Request & { user: JwtPayload }) {
    return this.orderService.create(createOrderDto, request.user);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all orders for store products (authenticated user)' })
  @ApiResponse({ status: 200, description: 'List of orders with order_items linked to store products', type: [Object] })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific order by ID (store products only, authenticated user)' })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order details for store products', type: Object })
  @ApiResponse({ status: 404, description: 'Not Found - Order not found or no store products' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order (store products only, authenticated user)' })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Order updated successfully', type: Object })
  @ApiResponse({ status: 404, description: 'Not Found - Order not found or no store products' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format or input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order (store products only, authenticated user)' })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully', type: Object })
  @ApiResponse({ status: 404, description: 'Not Found - Order not found or no store products' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }
}