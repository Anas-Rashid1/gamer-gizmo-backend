import { Module } from '@nestjs/common';
import { GPUService } from './gpu.service';
import { GPUContoller } from './gpu.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [GPUContoller],
  providers: [GPUService, PrismaService, JwtService],
})
export class GPUModule {}
