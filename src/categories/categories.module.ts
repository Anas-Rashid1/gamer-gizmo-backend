import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesContoller } from './categories.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [CategoriesContoller],
  providers: [CategoriesService, PrismaService, JwtService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
