import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { PrismaService } from '../prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { S3Service } from 'src/utils/s3.service';


@Module({
  imports: [MulterModule.register({ dest: './uploads' })],
  controllers: [AdsController],
  providers: [S3Service,AdsService, PrismaService],
})
export class AdsModule {}
