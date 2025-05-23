import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prismaService: PrismaService) {}

  async createChat(user1Id: number, user2Id: number) {
    if (user1Id === user2Id) {
      throw new BadRequestException('Cannot create a chat with the same user');
    }

    try {
      // Check if chat already exists
      const existingChat = await this.prismaService.chats.findFirst({
        where: {
          OR: [
            { user1_id: user1Id, user2_id: user2Id },
            { user1_id: user2Id, user2_id: user1Id },
          ],
        },
      });

      if (existingChat) {
        return { message: 'Chat already exists', data: existingChat };
      }

      // Create new chat
      const chat = await this.prismaService.chats.create({
        data: {
          user1_id: user1Id,
          user2_id: user2Id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return { message: 'Chat created successfully', data: chat };
    } catch (error) {
      throw new BadRequestException('Failed to create chat: ' + error.message);
    }
  }

  async getMessages(chatId: number) {
    try {
      const messages = await this.prismaService.messages.findMany({
        where: { chat_id: chatId },
        orderBy: { sent_at: 'asc' },
      });

      return { message: 'Messages retrieved successfully', data: messages };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve messages: ' + error.message);
    }
  }
}