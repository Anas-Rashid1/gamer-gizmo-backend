import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleSignInDto {
  @ApiProperty({ description: 'Google ID token' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({ description: 'Platform (e.g., ios, android, web)' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({ description: 'Region (optional)', required: false })
  @IsString()
  region?: string;
}