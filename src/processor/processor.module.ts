import { Module } from '@nestjs/common';
import { ProcessorService } from './processor.service';
import { ProcessorContoller } from './processor.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [ProcessorContoller],
  providers: [ProcessorService, PrismaService, JwtService],
})
export class ProcessorModule {}
