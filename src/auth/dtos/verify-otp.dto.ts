import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, IsString } from 'class-validator';
// import { Match } from './match.decorator'; // Custom validator for password confirmation

export class VerifyOtpDto {
  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Otp is required' })
  @MinLength(6, { message: 'Otp must be at least 6 characters long' })
  otp: string;
}
