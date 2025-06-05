import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class ChatService {
  private s3Client: S3Client;

  constructor(private readonly prismaService: PrismaService) {
    this.s3Client = new S3Client({
      region: 'eu-north-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  private async getSignedImageUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: 'gamergizmobucket',
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  }

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
        convertedId2Type: typeof id2,
      },
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
        this.prismaService.users.findUnique({ where: { id: id2 } }),
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
        where: { id: validChatId },
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

  async getBuyersAndSellers(userId: number) {
    try {
      const validUserId = Number(userId);
      if (isNaN(validUserId) || validUserId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }

      const buyerChats = await this.prismaService.chats.findMany({
        where: { user2_id: validUserId },
        select: {
          id: true,
          users_chats_user1_idTousers: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              is_seller: true,
              profile: true,
            },
          },
          messages: {
            orderBy: {
              sent_at: 'desc',
            },
            take: 1,
            select: {
              message_text: true,
              sent_at: true,
            },
          },
        },
      });

      const sellerChats = await this.prismaService.chats.findMany({
        where: { user1_id: validUserId },
        select: {
          id: true,
          users_chats_user2_idTousers: {
            select: {
              id: true,
              username: true,
              first_name: true,
              last_name: true,
              is_seller: true,
              profile: true,
            },
          },
          messages: {
            orderBy: {
              sent_at: 'desc',
            },
            take: 1,
            select: {
              message_text: true,
              sent_at: true,
            },
          },
        },
      });

      const buyers = await Promise.all(
        buyerChats.map(async (chat) => ({
          id: chat.users_chats_user1_idTousers.id,
          username: chat.users_chats_user1_idTousers.username,
          first_name: chat.users_chats_user1_idTousers.first_name,
          last_name: chat.users_chats_user1_idTousers.last_name,
          is_seller: chat.users_chats_user1_idTousers.is_seller,
          profile_picture: chat.users_chats_user1_idTousers.profile
            ? await this.getSignedImageUrl(
                chat.users_chats_user1_idTousers.profile,
              )
            : null,
          last_message: chat.messages[0] || null,
          chat_id: chat.id,
        })),
      );

      const sellers = await Promise.all(
        sellerChats.map(async (chat) => ({
          id: chat.users_chats_user2_idTousers.id,
          username: chat.users_chats_user2_idTousers.username,
          first_name: chat.users_chats_user2_idTousers.first_name,
          last_name: chat.users_chats_user2_idTousers.last_name,
          is_seller: chat.users_chats_user2_idTousers.is_seller,
          profile_picture: chat.users_chats_user2_idTousers.profile
            ? await this.getSignedImageUrl(
                chat.users_chats_user2_idTousers.profile,
              )
            : null,
          last_message: chat.messages[0] || null,
          chat_id: chat.id,
        })),
      );

      return {
        message: 'Buyers and sellers retrieved successfully',
        data: {
          buyers,
          sellers,
        },
      };
    } catch (error) {
      console.error('Get buyers and sellers error:', error);
      throw new BadRequestException(
        'Failed to retrieve buyers and sellers: ' + error.message,
      );
    }
  }
}
