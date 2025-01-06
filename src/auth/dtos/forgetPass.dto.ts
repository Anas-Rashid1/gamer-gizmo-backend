import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, IsString, IsEmail } from 'class-validator';

export class ForgetPassDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Otp is required' })
  @MinLength(6, { message: 'Otp must be at least 6 characters long' })
  otp: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
