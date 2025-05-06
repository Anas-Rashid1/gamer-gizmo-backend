import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsContoller } from './brands.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from 'src/utils/s3.service';


@Module({
  imports: [],
  controllers: [BrandsContoller],
  providers: [BrandsService, PrismaService, JwtService,S3Service],
})
export class BrandsModule {}
