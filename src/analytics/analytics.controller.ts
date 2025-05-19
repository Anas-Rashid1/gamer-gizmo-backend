import { Controller, Get, Query, Post, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, DailyAnalyticsResponseDto, LocationDto } from './dto/analytics.dto';
import { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('daily')
  async getDailyAnalytics(
    @Query() query: AnalyticsQueryDto,
  ): Promise<DailyAnalyticsResponseDto[]> {
    return this.analyticsService.getDailyAnalytics(query);
  }

  @Get('locations')
  async getLocations(): Promise<LocationDto[]> {
    return this.analyticsService.getLocations();
  }

  @Post('track-visitor')
  async trackVisitor(@Req() req: Request): Promise<void> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.analyticsService.trackVisitor(ipAddress);
  }
}