// import { ApiProperty } from '@nestjs/swagger';
// import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

// export class CreateProductDto {
//   @ApiProperty({ required: true })
//   @IsNotEmpty()
//   user_id: string;

//   @ApiProperty({ required: true })
//   @IsNotEmpty()
//   product_id: string;

//   @ApiProperty({ required: true })
//   @IsNotEmpty()
//   @IsString()
//   quantity: string;

//   @ApiProperty({ required: true })
//   @IsNotEmpty()
//   @IsString()
//   price: string;
// }

import { IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({ description: 'ID of the product to add to cart', example: 1 })
  @IsInt()
  @IsNotEmpty()
  product_id: number;

  @ApiProperty({ description: 'Quantity of the product', example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}