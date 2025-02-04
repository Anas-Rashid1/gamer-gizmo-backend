import { Module } from '@nestjs/common';
import { ModelService } from './model.service';
import { ModelContoller } from './model.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [ModelContoller],
  providers: [ModelService, PrismaService, JwtService],
})
export class ModelModule {}
