import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateVariant {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;
}
export class CreateProcessor {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsNumber()
  variant_id: number;
}
