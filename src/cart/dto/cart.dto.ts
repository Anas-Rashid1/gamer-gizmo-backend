import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  product_id: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  quantity: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  price: string;
}
