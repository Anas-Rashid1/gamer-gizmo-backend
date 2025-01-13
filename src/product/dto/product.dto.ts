import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  //   @IsNumber()
  user_id: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  price: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  stock: string;

  @ApiProperty({ required: true })
  @IsOptional()
  brand_id?: string;

  @ApiProperty({ required: true })
  @IsOptional()
  model_id?: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  is_published?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  processor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  processorType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  storage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  graphics?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ports?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  os?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  battery_life?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  screen_size?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  screen_resolution?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  component_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  text?: string;
}
