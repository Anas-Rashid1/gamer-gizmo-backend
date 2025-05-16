import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Not Found - User or Product not found' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all orders' })
  @ApiResponse({ status: 200, description: 'List of all orders with associated data', type: [Object] })
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific order by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order details', type: Object })
  @ApiResponse({ status: 404, description: 'Not Found - Order not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: 'Order updated successfully', type: Object })
  @ApiResponse({ status: 404, description: 'Not Found - Order not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format or input' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'id', type: Number, description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully', type: Object })
  @ApiResponse({ status: 404, description: 'Not Found - Order not found' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid ID format' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }
}