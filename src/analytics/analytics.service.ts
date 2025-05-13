import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto, DailyAnalyticsResponseDto, LocationDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getDailyAnalytics(query: AnalyticsQueryDto): Promise<DailyAnalyticsResponseDto[]> {
    try {
      const { startDate, endDate } = query;

      // Define date range (default to last 30 days if not provided)
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Query for daily signups, cast date to string
      const signupQuery = `
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(*) as signups
        FROM users
        WHERE created_at >= $1 AND created_at <= $2
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date;
      `;

      // Query for daily visitors, cast date to string
      const visitorQuery = `
        SELECT TO_CHAR(visited_at, 'YYYY-MM-DD') as date, COUNT(*) as visitors
        FROM visitors
        WHERE visited_at >= $1 AND visited_at <= $2
        GROUP BY TO_CHAR(visited_at, 'YYYY-MM-DD')
        ORDER BY date;
      `;

      // Execute queries
      const signups = await this.prisma.$queryRawUnsafe<
        { date: string; signups: number }[]
      >(signupQuery, start, end);

      const visitors = await this.prisma.$queryRawUnsafe<
        { date: string; visitors: number }[]
      >(visitorQuery, start, end);

      // Merge results
      const dateMap = new Map<string, DailyAnalyticsResponseDto>();

      // Initialize map with all dates in range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dateMap.set(dateStr, { date: dateStr, signups: 0, visitors: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Populate signups
      signups.forEach((signup) => {
        const dateStr = signup.date;
        if (dateMap.has(dateStr)) {
          dateMap.get(dateStr)!.signups = Number(signup.signups);
        }
      });

      // Populate visitors
      visitors.forEach((visitor) => {
        const dateStr = visitor.date;
        if (dateMap.has(dateStr)) {
          dateMap.get(dateStr)!.visitors = Number(visitor.visitors);
        }
      });

      this.logger.log(`Fetched daily analytics from ${start.toISOString()} to ${end.toISOString()}`);
      return Array.from(dateMap.values());
    } catch (error) {
      this.logger.error(`Failed to fetch daily analytics: ${error.message}`);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
  }

  async getLocations(): Promise<LocationDto[]> {
    try {
      const locations = await this.prisma.location.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              product_product_locationTolocation: true,
            },
          },
        },
        orderBy: {
          product_product_locationTolocation: {
            _count: 'desc',
          },
        },
      });

      const result: LocationDto[] = locations.map((location) => ({
        id: location.id,
        name: location.name,
        productCount: location._count.product_product_locationTolocation,
      }));

      this.logger.log(`Fetched ${locations.length} locations sorted by product count`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch locations: ${error.message}`);
      throw new Error(`Failed to fetch locations: ${error.message}`);
    }
  }

  async trackVisitor(ipAddress: string): Promise<void> {
    try {
      await this.prisma.visitors.create({
        data: {
          visited_at: new Date(),
          ip_address: ipAddress,
        },
      });
      this.logger.log(`Tracked visitor with IP ${ipAddress}`);
    } catch (error) {
      this.logger.error(`Failed to track visitor: ${error.message}`);
      throw new Error(`Failed to track visitor: ${error.message}`);
    }
  }
}