import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();

      this.logger.log('Prisma Client successfully connected to the database.');

      // Perform a test query to verify the connection
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database health check passed.');
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      process.exit(1); // Exit if the connection is not valid
    }
  }
}
