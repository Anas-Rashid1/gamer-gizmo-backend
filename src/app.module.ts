import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';

import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './product/product.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { ModelModule } from './model/model.module';
import { ComponentCategoryModule } from './component_category/componentCategory.module';
import { FavouriteModule } from './favourites/favourite.module';
import { CartModule } from './cart/cart.module';
import { UserModule } from './users/users.module';
import { LocationModule } from './location/location.module';
import { ProcessorModule } from './processor/processor.module';
import { RamModule } from './ram/ram.module';
import { GPUModule } from './gpu/gpu.module';
import { ConditionModule } from './condition/condition.module';
import { StorageModule } from './storage/storage.module';
import { BlogsModule } from './blogs/blogs.module';
import { ChatModule } from './chat/chat.module';
import { ThirdPartyAdsModule } from './third-party-ads/third-party-ads.module';
import { AdsModule } from './ads/ads.module';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsModule } from './analytics/analytics.module';
import { OrderController } from './order/order.controller';
import { OrderModule } from './order/order.module';
import { WebhookController } from './webhook/webhook.controller';
import { WebhookService } from './webhook/webhook.service';
import { WebhookModule } from './webhook/webhook.module';
import { AiChatbotModule } from './ai-chatbot/ai-chatbot.module';
import { SessionStoreService } from './session-store/session-store.service';

@Module({
  imports: [
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public', // Files will be accessible at '/public'
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    CategoriesModule,
    BrandsModule,
    ModelModule,
    GPUModule,
    ConditionModule,
    StorageModule,
    ChatModule,
    BlogsModule,
    ProcessorModule,
    RamModule,
    ComponentCategoryModule,
    ProductModule,
    FavouriteModule,
    LocationModule,
    CartModule,
    ThirdPartyAdsModule,
    AdsModule,
    AnalyticsModule,
    OrderModule,
    WebhookModule,
    AiChatbotModule,
  ],
  controllers: [AppController],
  providers: [AppService, SessionStoreService ],
})
export class AppModule {}
