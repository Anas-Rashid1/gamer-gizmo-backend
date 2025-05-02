import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsContoller } from './blogs.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from 'src/utils/s3.service';


@Module({
  imports: [],
  controllers: [BlogsContoller],
  providers: [S3Service,BlogsService, PrismaService, JwtService],
})
export class BlogsModule {}
