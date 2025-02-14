import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsContoller } from './blogs.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [BlogsContoller],
  providers: [BlogsService, PrismaService, JwtService],
})
export class BlogsModule {}
