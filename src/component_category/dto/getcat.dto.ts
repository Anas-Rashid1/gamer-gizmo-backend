import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class GetCatData {
  @ApiProperty({ required: true })
  @IsOptional()
  pageNo?: string;
}
