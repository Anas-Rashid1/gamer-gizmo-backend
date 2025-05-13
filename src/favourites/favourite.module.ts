import { Module } from '@nestjs/common';
import { AddToFavouriteContoller } from './favourite.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AddToFavouriteService } from './favourite.service';
import { S3Service } from 'src/utils/s3.service';

@Module({
  imports: [],
  controllers: [AddToFavouriteContoller],
  providers: [AddToFavouriteService, PrismaService, JwtService,S3Service],
})
export class FavouriteModule {}

