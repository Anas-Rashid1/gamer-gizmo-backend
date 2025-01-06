import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, IsString } from 'class-validator';
// import { Match } from './match.decorator'; // Custom validator for password confirmation

export class SendPassOtpDto {
  @ApiProperty()
  @IsString()
  email: string;
}
