import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingController } from './logging.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [LoggingService ,PrismaService],
  controllers: [LoggingController ]
})
export class LoggingModule {}
