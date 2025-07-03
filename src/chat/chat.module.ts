import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { S3Service } from 'src/utils/s3.service';
@Module({
  imports: [],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PrismaService, JwtService,S3Service],
})
export class ChatModule {}
