import { Controller, Get, Query, Post, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, DailyAnalyticsResponseDto, LocationDto,OrderAnalyticsResponseDto } from './dto/analytics.dto';
import { Request } from 'express';
import { ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger';

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

  
  @Get('orders')
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'productId', required: false, type: String, description: 'Product ID to filter by' })
  @ApiResponse({ status: 200, description: 'Order analytics data', type: OrderAnalyticsResponseDto })
  async getOrderAnalytics(
    @Query() query: AnalyticsQueryDto,
  ): Promise<OrderAnalyticsResponseDto> {
    return this.analyticsService.getOrderAnalytics(query);
  }
  @Post('track-visitor')
  async trackVisitor(@Req() req: Request): Promise<void> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    await this.analyticsService.trackVisitor(ipAddress);
  }

  
}