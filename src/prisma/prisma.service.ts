import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  
  constructor() {
    super();
    this.logger.log('PrismaService initialized');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting Prisma Client');
    await this.$disconnect();
  }
}
