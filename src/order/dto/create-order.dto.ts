import { IsNotEmpty, IsNumber, IsString, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Shipping address for the order' })
  @IsNotEmpty()
  @IsString()
  shipping_address: string;

  @ApiProperty({ description: 'Shipping rate for the order', default: 10.0 })
  @IsNumber()
  @Min(0)
  shipping_rate: number = 10.0;

  @ApiProperty({
    description: 'Payment method',
    enum: ['cash_on_delivery', 'online'],
  })
  @IsIn(['cash_on_delivery', 'online'])
  payment_method: 'cash_on_delivery' | 'online';
}
