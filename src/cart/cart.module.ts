import { Module } from '@nestjs/common';

import { CartContoller } from './cart.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CartService } from './cart.service';

@Module({
  imports: [],
  controllers: [CartContoller],
  providers: [CartService, PrismaService, JwtService],
})
export class CartModule {}
