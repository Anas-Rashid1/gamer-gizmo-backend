import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  ratings: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  user_id: string;
  @ApiProperty({ required: true })
  @IsNotEmpty()
  product_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comments: string;
}
