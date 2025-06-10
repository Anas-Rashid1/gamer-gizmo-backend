import { Module } from '@nestjs/common';
import { OrderController } from 'src/order/order.controller';

import { OrderModule } from 'src/order/order.module';
import { OrderService } from 'src/order/order.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CartModule } from 'src/cart/cart.module';
import { S3Service } from 'src/utils/s3.service';

@Module({
  imports: [OrderModule, CartModule],
  providers: [OrderService, WebhookService, PrismaService, S3Service],
  controllers: [OrderController, WebhookController],
})
export class WebhookModule {}
