// import { ApiProperty } from '@nestjs/swagger';
// import { IsInt, IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

// export class CreateOrUpdateAdDto {
//   @ApiProperty({
//     description: 'The primary database ID of the ad (used for updates)',
//     example: 1,
//     required: false,
//   })
//   @IsOptional()
//   @IsInt()
//   id?: number;  // Added for update using main ID

//   @ApiProperty({
//     description: 'The ad ID (custom ID for business use)',
//     example: 101,
//   })
//   @IsInt()
//   ad_id: number;

//   @ApiProperty({
//     description: 'The price of the ad',
//     example: 19.99,
//   })
//   @IsNumber()
//   price: number;

//   @ApiProperty({
//     description: 'The start date of the ad',
//     example: '2023-12-01T00:00:00.000Z',
//   })
//   @IsDateString()
//   start_date: string;

//   @ApiProperty({
//     description: 'The end date of the ad',
//     example: '2023-12-31T23:59:59.000Z',
//     required: false,
//   })
//   @IsOptional()
//   @IsDateString()
//   end_date?: string;

//   @ApiProperty({
//     description: 'The page associated with the ad',
//     example: 'homepage',
//   })
//   @IsString()
//   page: string;

//   @ApiProperty({
//     description: 'The image path (or URL to delete the ad)',
//     example: '/uploads/ad-image.jpg',
//     required: false,
//   })
//   @IsOptional()
//   @IsString()
//   url?: string;
// }
export class CreateOrUpdateAdDto {
  id?: number;
  ad_id: string;
  price: number;
  start_date: Date;
  end_date: Date;
  page: string;
}
