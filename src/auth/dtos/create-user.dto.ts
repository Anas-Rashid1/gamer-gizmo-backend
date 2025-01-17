import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsString,
  Validate,
  IsDate,
} from 'class-validator';
// import { Match } from './match.decorator'; // Custom validator for password confirmation

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Username is required' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username cannot exceed 20 characters' })
  username: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format. Must be in international format.',
  })
  phone: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Date is required' })
  @IsDate()
  dob: Date;

  @ApiProperty()
  @IsNotEmpty({ message: 'gender is required' })
  @IsString()
  gender: string;
}
