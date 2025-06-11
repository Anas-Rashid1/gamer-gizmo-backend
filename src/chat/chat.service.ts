// import { Injectable, BadRequestException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// @Injectable()
// export class ChatService {
//   private s3Client: S3Client;

//   constructor(private readonly prismaService: PrismaService) {
//     this.s3Client = new S3Client({
//       region: 'eu-north-1',
//       credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//       },
//     });
//   }

//   private async getSignedImageUrl(key: string): Promise<string> {
//     try {
//       const command = new GetObjectCommand({
//         Bucket: 'gamergizmobucket',
//         Key: key,
//       });
//       return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
//     } catch (error) {
//       console.error('Error generating signed URL:', error);
//       return null;
//     }
//   }

//   async createChat(user1Id: number, user2Id: number) {
//     // Convert to numbers and validate
//     const id1 = Number(user1Id);
//     const id2 = Number(user2Id);

//     // Debug logging
//     console.log('Chat Creation Debug:', {
//       originalUser1Id: user1Id,
//       originalUser2Id: user2Id,
//       convertedId1: id1,
//       convertedId2: id2,
//       types: {
//         originalUser1Type: typeof user1Id,
//         originalUser2Type: typeof user2Id,
//         convertedId1Type: typeof id1,
//         convertedId2Type: typeof id2,
//       },
//     });

//     // Validate that both IDs are valid numbers
//     if (isNaN(id1) || isNaN(id2)) {
//       throw new BadRequestException('Invalid user IDs provided');
//     }

//     // Validate that IDs are positive numbers
//     if (id1 <= 0 || id2 <= 0) {
//       throw new BadRequestException('User IDs must be positive numbers');
//     }

//     // Check for same user
//     if (id1 === id2) {
//       throw new BadRequestException('Cannot create a chat with the same user');
//     }

//     try {
//       // Check if chat already exists
//       const existingChat = await this.prismaService.chats.findFirst({
//         where: {
//           OR: [
//             { user1_id: id1, user2_id: id2 },
//             { user1_id: id2, user2_id: id1 },
//           ],
//         },
//       });

//       if (existingChat) {
//         console.log('Found existing chat:', existingChat);
//         return { message: 'Chat already exists', data: existingChat };
//       }

//       // Verify both users exist
//       const [user1Exists, user2Exists] = await Promise.all([
//         this.prismaService.users.findUnique({ where: { id: id1 } }),
//         this.prismaService.users.findUnique({ where: { id: id2 } }),
//       ]);

//       if (!user1Exists || !user2Exists) {
//         throw new BadRequestException('One or both users do not exist');
//       }

//       // Create new chat
//       const chat = await this.prismaService.chats.create({
//         data: {
//           user1_id: id1,
//           user2_id: id2,
//           created_at: new Date(),
//           updated_at: new Date(),
//         },
//       });

//       console.log('Created new chat:', chat);
//       return { message: 'Chat created successfully', data: chat };
//     } catch (error) {
//       console.error('Chat creation error:', error);
//       if (error instanceof BadRequestException) {
//         throw error;
//       }
//       throw new BadRequestException('Failed to create chat: ' + error.message);
//     }
//   }

//   async getMessages(chatId: number) {
//     try {
//       // Convert and validate chatId
//       const validChatId = Number(chatId);
//       if (isNaN(validChatId) || validChatId <= 0) {
//         throw new BadRequestException('Invalid chat ID');
//       }

//       // Verify chat exists
//       const chatExists = await this.prismaService.chats.findUnique({
//         where: { id: validChatId },
//       });

//       if (!chatExists) {
//         throw new BadRequestException('Chat not found');
//       }

//       const messages = await this.prismaService.messages.findMany({
//         where: { chat_id: validChatId },
//         orderBy: { sent_at: 'asc' },
//       });

//       return messages;
//     } catch (error) {
//       console.error('Get messages error:', error);
//       if (error instanceof BadRequestException) {
//         throw error;
//       }
//       throw new BadRequestException('Failed to get messages: ' + error.message);
//     }
//   }

//   async getBuyersAndSellers(userId: number) {
//     try {
//       const validUserId = Number(userId);
//       if (isNaN(validUserId) || validUserId <= 0) {
//         throw new BadRequestException('Invalid user ID');
//       }

//       const buyerChats = await this.prismaService.chats.findMany({
//         where: { user2_id: validUserId },
//         select: {
//           id: true,
//           users_chats_user1_idTousers: {
//             select: {
//               id: true,
//               username: true,
//               first_name: true,
//               last_name: true,
//               is_seller: true,
//               profile: true,
//             },
//           },
//           messages: {
//             orderBy: {
//               sent_at: 'desc',
//             },
//             take: 1,
//             select: {
//               message_text: true,
//               sent_at: true,
//             },
//           },
//         },
//       });

//       const sellerChats = await this.prismaService.chats.findMany({
//         where: { user1_id: validUserId },
//         select: {
//           id: true,
//           users_chats_user2_idTousers: {
//             select: {
//               id: true,
//               username: true,
//               first_name: true,
//               last_name: true,
//               is_seller: true,
//               profile: true,
//             },
//           },
//           messages: {
//             orderBy: {
//               sent_at: 'desc',
//             },
//             take: 1,
//             select: {
//               message_text: true,
//               sent_at: true,
//             },
//           },
//         },
//       });

//       const buyers = await Promise.all(
//         buyerChats.map(async (chat) => ({
//           id: chat.users_chats_user1_idTousers.id,
//           username: chat.users_chats_user1_idTousers.username,
//           first_name: chat.users_chats_user1_idTousers.first_name,
//           last_name: chat.users_chats_user1_idTousers.last_name,
//           is_seller: chat.users_chats_user1_idTousers.is_seller,
//           profile_picture: chat.users_chats_user1_idTousers.profile
//             ? await this.getSignedImageUrl(
//                 chat.users_chats_user1_idTousers.profile,
//               )
//             : null,
//           last_message: chat.messages[0] || null,
//           chat_id: chat.id,
//         })),
//       );

//       const sellers = await Promise.all(
//         sellerChats.map(async (chat) => ({
//           id: chat.users_chats_user2_idTousers.id,
//           username: chat.users_chats_user2_idTousers.username,
//           first_name: chat.users_chats_user2_idTousers.first_name,
//           last_name: chat.users_chats_user2_idTousers.last_name,
//           is_seller: chat.users_chats_user2_idTousers.is_seller,
//           profile_picture: chat.users_chats_user2_idTousers.profile
//             ? await this.getSignedImageUrl(
//                 chat.users_chats_user2_idTousers.profile,
//               )
//             : null,
//           last_message: chat.messages[0] || null,
//           chat_id: chat.id,
//         })),
//       );

//       return {
//         message: 'Buyers and sellers retrieved successfully',
//         data: {
//           buyers,
//           sellers,
//         },
//       };
//     } catch (error) {
//       console.error('Get buyers and sellers error:', error);
//       throw new BadRequestException(
//         'Failed to retrieve buyers and sellers: ' + error.message,
//       );
//     }
//   }

  
// }

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

  public async getSignedImageUrl(key: string): Promise<string | null> {
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
    const id1 = Number(user1Id);
    const id2 = Number(user2Id);

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

    if (isNaN(id1) || isNaN(id2)) {
      throw new BadRequestException('Invalid user IDs provided');
    }

    if (id1 <= 0 || id2 <= 0) {
      throw new BadRequestException('User IDs must be positive numbers');
    }

    if (id1 === id2) {
      throw new BadRequestException('Cannot create a chat with the same user');
    }

    try {
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

      const [user1Exists, user2Exists] = await Promise.all([
        this.prismaService.users.findUnique({ where: { id: id1 } }),
        this.prismaService.users.findUnique({ where: { id: id2 } }),
      ]);

      if (!user1Exists || !user2Exists) {
        throw new BadRequestException('One or both users do not exist');
      }

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
      const validChatId = Number(chatId);
      if (isNaN(validChatId) || validChatId <= 0) {
        throw new BadRequestException('Invalid chat ID');
      }

      const chatExists = await this.prismaService.chats.findUnique({
        where: { id: validChatId },
      });

      if (!chatExists) {
        throw new BadRequestException('Chat not found');
      }

      const messages = await this.prismaService.messages.findMany({
        where: { chat_id: validChatId },
        orderBy: { sent_at: 'asc' },
        select: {
          id: true,
          chat_id: true,
          sender_id: true,
          message_text: true,
          sent_at: true,
          is_read: true,
        },
      });

      return {
        message: 'Messages retrieved successfully',
        data: messages.map((msg) => ({
          id: msg.id,
          chat_id: msg.chat_id,
          sender_id: msg.sender_id,
          message_text: msg.message_text,
          sent_at: msg.sent_at.toISOString(),
          is_read: msg.is_read,
        })),
      };
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
            orderBy: { sent_at: 'desc' },
            take: 1,
            select: { message_text: true, sent_at: true, is_read: true },
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
            orderBy: { sent_at: 'desc' },
            take: 1,
            select: { message_text: true, sent_at: true, is_read: true },
          },
        },
      });

      const unreadCounts = await this.prismaService.messages.groupBy({
        by: ['chat_id'],
        where: {
          chat_id: {
            in: [
              ...buyerChats.map((chat) => chat.id),
              ...sellerChats.map((chat) => chat.id),
            ],
          },
          is_read: false,
          sender_id: { not: validUserId },
        },
        _count: {
          id: true,
        },
      });

      const unreadMap = new Map(
        unreadCounts.map((item) => [item.chat_id, item._count.id]),
      );

      const buyers = await Promise.all(
        buyerChats.map(async (chat) => ({
          id: chat.users_chats_user1_idTousers.id,
          username: chat.users_chats_user1_idTousers.username,
          first_name: chat.users_chats_user1_idTousers.first_name,
          last_name: chat.users_chats_user1_idTousers.last_name,
          is_seller: chat.users_chats_user1_idTousers.is_seller,
          profile_picture: chat.users_chats_user1_idTousers.profile
            ? await this.getSignedImageUrl(chat.users_chats_user1_idTousers.profile)
            : null,
          last_message: chat.messages[0]
            ? {
                message_text: chat.messages[0].message_text,
                sent_at: chat.messages[0].sent_at.toISOString(),
                is_read: chat.messages[0].is_read,
              }
            : null,
          chat_id: chat.id,
          unread_count: unreadMap.get(chat.id) || 0,
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
            ? await this.getSignedImageUrl(chat.users_chats_user2_idTousers.profile)
            : null,
          last_message: chat.messages[0]
            ? {
                message_text: chat.messages[0].message_text,
                sent_at: chat.messages[0].sent_at.toISOString(),
                is_read: chat.messages[0].is_read,
              }
            : null,
          chat_id: chat.id,
          unread_count: unreadMap.get(chat.id) || 0,
        })),
      );

      return {
        message: 'Buyers and sellers retrieved successfully',
        data: { buyers, sellers },
      };
    } catch (error) {
      console.error('Get buyers and sellers error:', error);
      throw new BadRequestException('Failed to retrieve buyers and sellers: ' + error.message);
    }
  }

  async createCommunityMessage(data: { content: string; is_admin: boolean; sender_id: number }) {
    try {
      const dataToSend = {
        content: data.content,
        is_admin: Boolean(data.is_admin),
        ...(data.is_admin ? { admin_id: data.sender_id } : { sender_id: data.sender_id }),
      };

      const message = await this.prismaService.community_messages.create({
        data: dataToSend,
        include: {
          users: {
            select: {
              username: true,
              profile: true,
            },
          },
        },
      });

      const profilePicture = message.users?.profile
        ? await this.getSignedImageUrl(message.users.profile)
        : null;

      return {
        message: 'Community message created successfully',
        data: {
          id: message.id,
          content: message.content,
          is_admin: message.is_admin,
          sender_id: message.sender_id,
          admin_id: message.admin_id,
          created_at: message.created_at.toISOString(),
          users: {
            username: message.users?.username || 'Unknown',
            profile_picture: profilePicture,
          },
        },
      };
    } catch (error) {
      console.error('Create community message error:', error);
      throw new BadRequestException('Failed to create community message: ' + error.message);
    }
  }

  async getCommunityMessages({ beforeId }: { beforeId?: number }) {
    try {
      const messages = await this.prismaService.community_messages.findMany({
        where: beforeId ? { id: { lt: beforeId } } : undefined,
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          users: {
            select: {
              username: true,
              profile: true,
            },
          },
        },
      });

      const mappedMessages = await Promise.all(
        messages.map(async (msg) => {
          const profilePicture = msg.users?.profile
            ? await this.getSignedImageUrl(msg.users.profile)
            : null;
          return {
            id: msg.id,
            content: msg.content,
            is_admin: msg.is_admin,
            sender_id: msg.sender_id,
            admin_id: msg.admin_id,
            created_at: msg.created_at.toISOString(),
            users: {
              username: msg.users?.username || 'Unknown',
              profile_picture: profilePicture,
            },
          };
        })
      );

      return mappedMessages.reverse();
    } catch (error) {
      console.error('Get community messages error:', error);
      throw new BadRequestException('Failed to get community messages: ' + error.message);
    }
  }
}