import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateLaptopDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'RAM must be at least 1 character long' })
  @MaxLength(50, { message: 'RAM cannot exceed 50 characters' })
  ram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Processor must be at least 1 character long' })
  @MaxLength(50, { message: 'Processor cannot exceed 50 characters' })
  processor?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Storage must be at least 1 character long' })
  @MaxLength(50, { message: 'Storage cannot exceed 50 characters' })
  storage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Graphics must be at least 1 character long' })
  @MaxLength(50, { message: 'Graphics cannot exceed 50 characters' })
  graphics?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Ports must be at least 1 character long' })
  @MaxLength(50, { message: 'Ports cannot exceed 50 characters' })
  ports?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Battery life must be at least 1 character long' })
  @MaxLength(50, { message: 'Battery life cannot exceed 50 characters' })
  batteryLife?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Screen size must be at least 1 character long' })
  @MaxLength(50, { message: 'Screen size cannot exceed 50 characters' })
  screenSize?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Weight must be at least 1 character long' })
  @MaxLength(50, { message: 'Weight cannot exceed 50 characters' })
  weight?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, {
    message: 'Screen resolution must be at least 1 character long',
  })
  @MaxLength(50, { message: 'Screen resolution cannot exceed 50 characters' })
  screenResolution?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'OS must be at least 1 character long' })
  @MaxLength(50, { message: 'OS cannot exceed 50 characters' })
  os?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Processor type must be at least 1 character long' })
  @MaxLength(50, { message: 'Processor type cannot exceed 50 characters' })
  processorType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Color must be at least 1 character long' })
  @MaxLength(50, { message: 'Color cannot exceed 50 characters' })
  color?: string;
}
