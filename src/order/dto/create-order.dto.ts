import { IsInt, IsString, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ description: 'ID of the product', example: 1 })
  @IsInt()
  product_id: number;

  @ApiProperty({ description: 'Quantity of the product', example: 2 })
  @IsInt()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'ID of the user placing the order', example: 1 })
  @IsInt()
  user_id: number;

  @ApiProperty({ description: 'Shipping address for the order', example: '123 Test Street, City, Country' })
  @IsString()
  @IsNotEmpty()
  shipping_address: string;

  @ApiProperty({ description: 'List of order items', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  order_items: OrderItemDto[];
}