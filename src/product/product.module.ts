import { Module } from '@nestjs/common';

import { ProductsContoller } from './product.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ProductService } from './product.service';

@Module({
  imports: [],
  controllers: [ProductsContoller],
  providers: [ProductService, PrismaService, JwtService],
})
export class ProductModule {}
