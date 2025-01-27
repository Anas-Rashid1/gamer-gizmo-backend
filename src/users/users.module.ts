import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserContoller } from './users.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [UserContoller],
  providers: [UserService, PrismaService, JwtService],
})
export class UserModule {}
