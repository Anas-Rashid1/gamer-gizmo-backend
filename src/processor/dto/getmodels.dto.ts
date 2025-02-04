import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class GetProcessorDto {
  @ApiProperty({ required: false })
  variant: string;
}
