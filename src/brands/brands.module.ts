import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsContoller } from './brands.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [BrandsContoller],
  providers: [BrandsService, PrismaService, JwtService],
})
export class BrandsModule {}
