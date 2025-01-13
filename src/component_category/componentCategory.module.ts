import { Module } from '@nestjs/common';
import { ComponentCategoryService } from './componentCategory.service';
import { ComponentCategoryController } from './componentCategory.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [ComponentCategoryController],
  providers: [ComponentCategoryService, PrismaService, JwtService],
})
export class ComponentCategoryModule {}
