import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddToFavouriteDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  userId: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  productId: string;
}
