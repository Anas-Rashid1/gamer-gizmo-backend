import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiProperty({ description: 'Order status', required: false })
  @IsOptional()
  @IsString()
  order_status?: string;

  @ApiProperty({ description: 'Shipping address', required: false })
  @IsOptional()
  @IsString()
  shipping_address?: string;

  @ApiProperty({ description: 'Shipping rate for the order', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shipping_rate?: number;
}