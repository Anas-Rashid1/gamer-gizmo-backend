import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { CartModule } from '../cart/cart.module';
import { S3Service } from 'src/utils/s3.service';
import { WebhookController } from 'src/webhook/webhook.controller';
import { WebhookService } from 'src/webhook/webhook.service';

@Module({
  imports: [CartModule],
  controllers: [OrderController ],
  providers: [OrderService, PrismaService,S3Service ],
})
export class OrderModule {}