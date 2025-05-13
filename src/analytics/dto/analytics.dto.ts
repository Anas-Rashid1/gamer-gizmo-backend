import { IsDateString, IsOptional } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DailyAnalyticsResponseDto {
  date: string;
  signups: number;
  visitors: number;
}

export class LocationDto {
  id: number;
  name: string;
  productCount: number;
}