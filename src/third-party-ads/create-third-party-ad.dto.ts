import { IsString, IsUrl, IsBoolean, IsDateString } from 'class-validator';

export class CreateThirdPartyAdDto {
  @IsString()
  title: string;

  @IsUrl()
  imageUrl: string;

  @IsUrl()
  link: string;

  @IsBoolean()
  isActive: boolean;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
