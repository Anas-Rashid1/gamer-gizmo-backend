import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Shipping address for the order' })
  @IsNotEmpty()
  @IsString()
  shipping_address: string;

  @ApiProperty({ description: 'Shipping rate for the order', default: 10.00 })
  @IsNumber()
  @Min(0)
  shipping_rate: number = 10.00;
}