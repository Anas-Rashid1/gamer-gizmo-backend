import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateBrandsDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  // @IsNumber()
  category_id: string;

  @ApiProperty({ required: true })
  // @IsNotEmpty()
  // @IsString()
  logo: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  // @IsBoolean()
  status: boolean;
}
