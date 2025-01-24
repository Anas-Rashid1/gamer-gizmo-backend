import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class GetModlesDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  brand: string;
  @ApiProperty({ required: true })
  @IsOptional()
  pageNo?: string;
}
