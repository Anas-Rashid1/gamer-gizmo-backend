import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserContoller } from './users.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from 'src/utils/s3.service';

@Module({
  imports: [],
  controllers: [UserContoller],
  providers: [UserService, PrismaService, JwtService, S3Service],
})
export class UserModule {}