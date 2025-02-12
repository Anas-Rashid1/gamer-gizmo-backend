import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  id: string;
}
