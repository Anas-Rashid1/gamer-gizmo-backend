import { Module } from '@nestjs/common';
import { ConditionService } from './condition.service';
import { ConditionContoller } from './condition.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [ConditionContoller],
  providers: [ConditionService, PrismaService, JwtService],
})
export class ConditionModule {}
