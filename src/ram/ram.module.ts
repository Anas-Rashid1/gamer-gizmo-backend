import { Module } from '@nestjs/common';
import { RamService } from './ram.service';
import { RamContoller } from './ram.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [RamContoller],
  providers: [RamService, PrismaService, JwtService],
})
export class RamModule {}
