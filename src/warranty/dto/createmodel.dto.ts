import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateModelsto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  // @IsNumber()
  brand_id: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  // @IsBoolean()
  status: boolean;
}
