import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, IsString, IsEmail } from 'class-validator';

export class LoginUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Username or Email is required' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'platform is required' })
  platform: string;
  @ApiProperty()
  region: string;
}
export class LoginAdminDto {
  @ApiProperty()
  @IsNotEmpty({ message: ' Email is required' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

}
