import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LocationContoller } from './location.controller';

@Module({
  imports: [],
  controllers: [LocationContoller],
  providers: [LocationService, PrismaService, JwtService],
})
export class LocationModule {}
