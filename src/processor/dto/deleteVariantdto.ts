import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';

export class DeleteVariantsDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  id: string;
}
