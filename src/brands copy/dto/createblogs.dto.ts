import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateBlogDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ required: true })
  images: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  // @IsNumber()
  admin_id: string;

  @ApiProperty({ required: true })
  // @IsNotEmpty()
  @IsString()
  tags: string;
}
