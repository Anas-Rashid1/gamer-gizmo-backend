// import { Module } from '@nestjs/common';

// import { CartContoller } from './cart.controller';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { JwtService } from '@nestjs/jwt';
// import { CartService } from './cart.service';

// @Module({
//   imports: [],
//   controllers: [CartContoller],
//   providers: [CartService, PrismaService, JwtService],
// })
// export class CartModule {}

import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from 'src/utils/s3.service';

@Module({
  controllers: [CartController],
  providers: [S3Service, CartService, PrismaService, JwtService],
  exports: [CartService], // Export CartService for use in OrderModule
})
export class CartModule {}