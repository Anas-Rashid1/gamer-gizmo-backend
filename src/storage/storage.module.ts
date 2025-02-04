import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { RamContoller } from './storage.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [RamContoller],
  providers: [StorageService, PrismaService, JwtService],
})
export class StorageModule {}
