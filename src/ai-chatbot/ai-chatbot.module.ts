import { Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { AiChatbotService } from './ai-chatbot.service';
import { AiChatbotController } from './ai-chatbot.controller';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from 'src/categories/categories.module';

import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports: [ConfigModule, ProductModule, CategoriesModule,PrismaModule],
  controllers: [AiChatbotController],
  providers: [AiChatbotService],
  
})
export class AiChatbotModule {}
