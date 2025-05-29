// import { Injectable, BadRequestException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Injectable()
// export class ChatService {
//   constructor(private readonly prismaService: PrismaService) {}

//   async createChat(user1Id: number, user2Id: number) {
//     if (user1Id === user2Id) {
//       throw new BadRequestException('Cannot create a chat with the same user');
//     }

//     try {
//       // Check if chat already exists
//       const existingChat = await this.prismaService.chats.findFirst({
//         where: {
//           OR: [
//             { user1_id: user1Id, user2_id: user2Id },
//             { user1_id: user2Id, user2_id: user1Id },
//           ],
//         },
//       });

//       if (existingChat) {
//         return { message: 'Chat already exists', data: existingChat };
//       }

//       // Create new chat
//       const chat = await this.prismaService.chats.create({
//         data: {
//           user1_id: user1Id,
//           user2_id: user2Id,
//           created_at: new Date(),
//           updated_at: new Date(),
//         },
//       });

//       return { message: 'Chat created successfully', data: chat };
//     } catch (error) {
//       throw new BadRequestException('Failed to create chat: ' + error.message);
//     }
//   }

//   async getMessages(chatId: number) {
//     try {
//       const messages = await this.prismaService.messages.findMany({
//         where: { chat_id: chatId },
//         orderBy: { sent_at: 'asc' },
//       });

//       return { message: 'Messages retrieved successfully', data: messages };
//     } catch (error) {
//       throw new BadRequestException('Failed to retrieve messages: ' + error.message);
//     }
//   }
// }
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prismaService: PrismaService) {}

  async createChat(user1Id: number, user2Id: number) {
    // Convert to numbers and validate
    const id1 = Number(user1Id);
    const id2 = Number(user2Id);

    // Debug logging
    console.log('Chat Creation Debug:', {
      originalUser1Id: user1Id,
      originalUser2Id: user2Id,
      convertedId1: id1,
      convertedId2: id2,
      types: {
        originalUser1Type: typeof user1Id,
        originalUser2Type: typeof user2Id,
        convertedId1Type: typeof id1,
        convertedId2Type: typeof id2
      }
    });

    // Validate that both IDs are valid numbers
    if (isNaN(id1) || isNaN(id2)) {
      throw new BadRequestException('Invalid user IDs provided');
    }

    // Validate that IDs are positive numbers
    if (id1 <= 0 || id2 <= 0) {
      throw new BadRequestException('User IDs must be positive numbers');
    }

    // Check for same user
    if (id1 === id2) {
      throw new BadRequestException('Cannot create a chat with the same user');
    }

    try {
      // Check if chat already exists
      const existingChat = await this.prismaService.chats.findFirst({
        where: {
          OR: [
            { user1_id: id1, user2_id: id2 },
            { user1_id: id2, user2_id: id1 },
          ],
        },
      });

      if (existingChat) {
        console.log('Found existing chat:', existingChat);
        return { message: 'Chat already exists', data: existingChat };
      }

      // Verify both users exist
      const [user1Exists, user2Exists] = await Promise.all([
        this.prismaService.users.findUnique({ where: { id: id1 } }),
        this.prismaService.users.findUnique({ where: { id: id2 } })
      ]);

      if (!user1Exists || !user2Exists) {
        throw new BadRequestException('One or both users do not exist');
      }

      // Create new chat
      const chat = await this.prismaService.chats.create({
        data: {
          user1_id: id1,
          user2_id: id2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      console.log('Created new chat:', chat);
      return { message: 'Chat created successfully', data: chat };
    } catch (error) {
      console.error('Chat creation error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create chat: ' + error.message);
    }
  }

  async getMessages(chatId: number) {
    try {
      // Convert and validate chatId
      const validChatId = Number(chatId);
      if (isNaN(validChatId) || validChatId <= 0) {
        throw new BadRequestException('Invalid chat ID');
      }

      // Verify chat exists
      const chatExists = await this.prismaService.chats.findUnique({
        where: { id: validChatId }
      });

      if (!chatExists) {
        throw new BadRequestException('Chat not found');
      }

      const messages = await this.prismaService.messages.findMany({
        where: { chat_id: validChatId },
        orderBy: { sent_at: 'asc' },
      });

      return messages;
    } catch (error) {
      console.error('Get messages error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to get messages: ' + error.message);
    }
  }
}