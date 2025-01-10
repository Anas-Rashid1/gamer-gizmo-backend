import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { LaptopModule } from './laptop/laptop.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { ModelModule } from './model/model.module';

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
    CategoriesModule,
    BrandsModule,
    ModelModule,
    LaptopModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
