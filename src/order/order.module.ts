import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { CartModule } from '../cart/cart.module';
import { S3Service } from 'src/utils/s3.service';

@Module({
  imports: [CartModule],
  controllers: [OrderController],
  providers: [OrderService, PrismaService,S3Service],
})
export class OrderModule {}