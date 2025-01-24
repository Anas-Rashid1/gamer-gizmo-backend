import { Module } from '@nestjs/common';
import { BrandsService } from './users.service';
import { BrandsContoller } from './users.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [BrandsContoller],
  providers: [BrandsService, PrismaService, JwtService],
})
export class UserModule {}
