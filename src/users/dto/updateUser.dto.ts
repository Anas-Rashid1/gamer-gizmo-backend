import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString() // Validates phone number globally. Pass a region code like 'US' for specific validation.
  phone: string;

  @IsDateString() // Validates ISO 8601 date format
  dob: string;

  @IsEnum(['male', 'female', 'other'], {
    message: 'Gender must be male, female, or other',
  })
  gender: 'male' | 'female' | 'other';

  @IsOptional() // Makes the address field optional
  @IsString() // Ensures the address is a string if provided
  address: string | null;
}
