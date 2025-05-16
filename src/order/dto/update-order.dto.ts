import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiProperty({ description: 'Status of the order', example: 'SHIPPED', required: false })
  @IsString()
  @IsOptional()
  order_status?: string;

  @ApiProperty({ description: 'Updated shipping address', example: '456 Updated Street, City, Country', required: false })
  @IsString()
  @IsOptional()
  shipping_address?: string;
}