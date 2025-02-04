import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;
}
