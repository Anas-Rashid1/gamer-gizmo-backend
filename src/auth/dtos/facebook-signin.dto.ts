import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FacebookSignInDto {
  @ApiProperty({ description: 'Facebook access token' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({ description: 'Platform (e.g., ios, android, web)' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({ description: 'Region (optional)', required: false })
  @IsString()
  region?: string;
}