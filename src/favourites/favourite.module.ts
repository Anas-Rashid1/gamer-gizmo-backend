import { Module } from '@nestjs/common';
import { AddToFavouriteContoller } from './favourite.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AddToFavouriteService } from './favourite.service';

@Module({
  imports: [],
  controllers: [AddToFavouriteContoller],
  providers: [AddToFavouriteService, PrismaService, JwtService],
})
export class FavouriteModule {}
