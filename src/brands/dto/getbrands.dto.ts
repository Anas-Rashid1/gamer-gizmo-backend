import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class GetBrandsDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  category: string;
  @ApiProperty({ required: true })
  @IsOptional()
  pageNo?: string;
}
