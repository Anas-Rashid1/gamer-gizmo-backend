import { Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { AiChatbotService } from './ai-chatbot.service';
import { AiChatbotController } from './ai-chatbot.controller';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from 'src/categories/categories.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SessionStorageModule } from 'src/session-store/session-storage.module';
import { ProductService } from 'src/product/product.service';
import { CategoriesService } from 'src/categories/categories.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SessionStoreService } from 'src/session-store/session-store.service';
import { S3Service } from 'src/utils/s3.service';
@Module({
  imports: [
    ConfigModule,
    ProductModule,
    CategoriesModule,
    PrismaModule,
    SessionStorageModule,
  ],
  controllers: [AiChatbotController],

  
  providers: [
    AiChatbotService,
    ProductService,
    CategoriesService,
    PrismaService,
    SessionStoreService,
    S3Service,
  ],
})
export class AiChatbotModule {}
