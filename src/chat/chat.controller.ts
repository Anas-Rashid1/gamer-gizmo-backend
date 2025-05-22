// import { Controller, Get } from '@nestjs/common';
// import { ChatService } from './chat.service';

// @Controller('Chat')
// export class ChatController {
//   constructor(private chatService: ChatService) {}

//   @Get('messages')
//   async getMessages() {
//     return this.chatService.getMessages({ });
//   }
// }

import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Chats')
@Controller('/chats')
export class ChatController {
  constructor(private readonly prismaService: PrismaService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('/create')
  async createChat(@Body() body: { user1Id: number; user2Id: number }) {
    try {
      // Check if chat already exists
      const existingChat = await this.prismaService.chats.findFirst({
        where: {
          OR: [
            { user1_id: body.user1Id, user2_id: body.user2Id },
            { user1_id: body.user2Id, user2_id: body.user1Id },
          ],
        },
      });

      if (existingChat) {
        return { message: 'Chat already exists', data: existingChat };
      }

      const chat = await this.prismaService.chats.create({
        data: {
          user1_id: body.user1Id,
          user2_id: body.user2Id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return { message: 'Chat created successfully', data: chat };
    } catch (error) {
      throw new BadRequestException('Failed to create chat');
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('/messages')
  @ApiQuery({ name: 'chatId', required: true, type: String })
  async getMessages(@Query('chatId') chatId: string) {
    try {
      const parsedChatId = parseInt(chatId);
      if (isNaN(parsedChatId)) {
        throw new BadRequestException('Invalid chat ID');
      }

      const messages = await this.prismaService.messages.findMany({
        where: { chat_id: parsedChatId },
        orderBy: { sent_at: 'asc' },
      });

      return { message: 'Messages retrieved successfully', data: messages };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve messages');
    }
  }
}