import { Module } from '@nestjs/common';
import { laptopService } from './laptop.service';
import { LaptopContoller } from './laptop.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [LaptopContoller],
  providers: [laptopService, PrismaService, JwtService],
})
export class LaptopModule {}
