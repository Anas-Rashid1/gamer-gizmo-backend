
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

//   public async getSignedImageUrl(key: string): Promise<string | null> {
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
//     const id1 = Number(user1Id);
//     const id2 = Number(user2Id);

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

//     if (isNaN(id1) || isNaN(id2)) {
//       throw new BadRequestException('Invalid user IDs provided');
//     }

//     if (id1 <= 0 || id2 <= 0) {
//       throw new BadRequestException('User IDs must be positive numbers');
//     }

//     if (id1 === id2) {
//       throw new BadRequestException('Cannot create a chat with the same user');
//     }

//     try {
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

//       const [user1Exists, user2Exists] = await Promise.all([
//         this.prismaService.users.findUnique({ where: { id: id1 } }),
//         this.prismaService.users.findUnique({ where: { id: id2 } }),
//       ]);

//       if (!user1Exists || !user2Exists) {
//         throw new BadRequestException('One or both users do not exist');
//       }

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
//       const validChatId = Number(chatId);
//       if (isNaN(validChatId) || validChatId <= 0) {
//         throw new BadRequestException('Invalid chat ID');
//       }

//       const chatExists = await this.prismaService.chats.findUnique({
//         where: { id: validChatId },
//       });

//       if (!chatExists) {
//         throw new BadRequestException('Chat not found');
//       }

//       const messages = await this.prismaService.messages.findMany({
//         where: { chat_id: validChatId },
//         orderBy: { sent_at: 'asc' },
//         select: {
//           id: true,
//           chat_id: true,
//           sender_id: true,
//           message_text: true,
//           sent_at: true,
//           is_read: true,
//         },
//       });

//       return {
//         message: 'Messages retrieved successfully',
//         data: messages.map((msg) => ({
//           id: msg.id,
//           chat_id: msg.chat_id,
//           sender_id: msg.sender_id,
//           message_text: msg.message_text,
//           sent_at: msg.sent_at.toISOString(),
//           is_read: msg.is_read,
//         })),
//       };
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
//             orderBy: { sent_at: 'desc' },
//             take: 1,
//             select: { message_text: true, sent_at: true, is_read: true },
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
//             orderBy: { sent_at: 'desc' },
//             take: 1,
//             select: { message_text: true, sent_at: true, is_read: true },
//           },
//         },
//       });

//       const unreadCounts = await this.prismaService.messages.groupBy({
//         by: ['chat_id'],
//         where: {
//           chat_id: {
//             in: [
//               ...buyerChats.map((chat) => chat.id),
//               ...sellerChats.map((chat) => chat.id),
//             ],
//           },
//           is_read: false,
//           sender_id: { not: validUserId },
//         },
//         _count: {
//           id: true,
//         },
//       });

//       const unreadMap = new Map(
//         unreadCounts.map((item) => [item.chat_id, item._count.id]),
//       );

//       const buyers = await Promise.all(
//         buyerChats.map(async (chat) => ({
//           id: chat.users_chats_user1_idTousers.id,
//           username: chat.users_chats_user1_idTousers.username,
//           first_name: chat.users_chats_user1_idTousers.first_name,
//           last_name: chat.users_chats_user1_idTousers.last_name,
//           is_seller: chat.users_chats_user1_idTousers.is_seller,
//           profile_picture: chat.users_chats_user1_idTousers.profile
//             ? await this.getSignedImageUrl(chat.users_chats_user1_idTousers.profile)
//             : null,
//           last_message: chat.messages[0]
//             ? {
//                 message_text: chat.messages[0].message_text,
//                 sent_at: chat.messages[0].sent_at.toISOString(),
//                 is_read: chat.messages[0].is_read,
//               }
//             : null,
//           chat_id: chat.id,
//           unread_count: unreadMap.get(chat.id) || 0,
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
//             ? await this.getSignedImageUrl(chat.users_chats_user2_idTousers.profile)
//             : null,
//           last_message: chat.messages[0]
//             ? {
//                 message_text: chat.messages[0].message_text,
//                 sent_at: chat.messages[0].sent_at.toISOString(),
//                 is_read: chat.messages[0].is_read,
//               }
//             : null,
//           chat_id: chat.id,
//           unread_count: unreadMap.get(chat.id) || 0,
//         })),
//       );

//       return {
//         message: 'Buyers and sellers retrieved successfully',
//         data: { buyers, sellers },
//       };
//     } catch (error) {
//       console.error('Get buyers and sellers error:', error);
//       throw new BadRequestException('Failed to retrieve buyers and sellers: ' + error.message);
//     }
//   }

//   async createCommunityMessage(data: { content: string; is_admin: boolean; sender_id: number }) {
//   try {
//     const dataToSend = {
//       content: data.content,
//       is_admin: Boolean(data.is_admin),
//       ...(data.is_admin ? { admin_id: data.sender_id } : { sender_id: data.sender_id }),
//     };

//     const message = await this.prismaService.community_messages.create({
//       data: dataToSend,
//       include: {
//         users: {
//           select: {
//             username: true,
//             profile: true,
//           },
//         },
//         message_reactions: {
//           select: {
//             id: true,
//             emoji_type: true,
//             user_id: true,
//             created_at: true,
//             users: {
//               select: {
//                 username: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     const profilePicture = message.users?.profile
//       ? await this.getSignedImageUrl(message.users.profile)
//       : null;

//     return {
//       message: 'Community message created successfully',
//       data: {
//         id: message.id,
//         content: message.content,
//         is_admin: message.is_admin,
//         sender_id: message.sender_id,
//         admin_id: message.admin_id,
//         created_at: message.created_at.toISOString(),
//         users: {
//           username: message.users?.username || 'Unknown',
//           profile_picture: profilePicture,
//         },
//         reactions: message.message_reactions.map((reaction) => ({
//           id: reaction.id,
//           emoji_type: reaction.emoji_type,
//           user_id: reaction.user_id,
//           username: reaction.users.username,
//           created_at: reaction.created_at.toISOString(),
//         })),
//       },
//     };
//   } catch (error) {
//     console.error('Create community message error:', error);
//     throw new BadRequestException('Failed to create community message: ' + error.message);
//   }
// }

//   async getCommunityMessages({ beforeId }: { beforeId?: number }) {
//     try {
//       const messages = await this.prismaService.community_messages.findMany({
//         where: beforeId ? { id: { lt: beforeId } } : undefined,
//         orderBy: { created_at: 'desc' },
//         take: 10,
//         include: {
//           users: {
//             select: {
//               username: true,
//               profile: true,
//             },
//           },
//           message_reactions: {
//             select: {
//               id: true,
//               emoji_type: true,
//               user_id: true,
//               created_at: true,
//               users: {
//                 select: {
//                   username: true,
//                 },
//               },
//             },
//           },
//         },
//       });

//       const mappedMessages = await Promise.all(
//         messages.map(async (msg) => {
//           const profilePicture = msg.users?.profile
//             ? await this.getSignedImageUrl(msg.users.profile)
//             : null;
//           return {
//             id: msg.id,
//             content: msg.content,
//             is_admin: msg.is_admin,
//             sender_id: msg.sender_id,
//             admin_id: msg.admin_id,
//             created_at: msg.created_at.toISOString(),
//             users: {
//               username: msg.users?.username || 'Unknown',
//               profile_picture: profilePicture,
//             },
//             reactions: msg.message_reactions.map((reaction) => ({
//               id: reaction.id,
//               emoji_type: reaction.emoji_type,
//               user_id: reaction.user_id,
//               username: reaction.users.username,
//               created_at: reaction.created_at.toISOString(),
//             })),
//           };
//         })
//       );

//       return mappedMessages.reverse();
//     } catch (error) {
//       console.error('Get community messages error:', error);
//       throw new BadRequestException('Failed to get community messages: ' + error.message);
//     }
//   }

//   async toggleMessageReaction(data: { messageId: number; userId: number; emoji: string }) {
//     try {
//       const { messageId, userId, emoji } = data;

//       // Validate inputs
//       if (!messageId || !userId || !emoji) {
//         throw new BadRequestException('Missing required fields: messageId, userId, or emoji');
//       }

//       // Check if message exists
//       const message = await this.prismaService.community_messages.findUnique({
//         where: { id: messageId },
//       });
//       if (!message) {
//         throw new BadRequestException('Message not found');
//       }

//       // Check if user exists
//       const user = await this.prismaService.users.findUnique({
//         where: { id: userId },
//       });
//       if (!user) {
//         throw new BadRequestException('User not found');
//       }

//       // Check if reaction exists
//       const existingReaction = await this.prismaService.message_reactions.findFirst({
//         where: {
//           message_id: messageId,
//           user_id: userId,
//           emoji_type: emoji,
//         },
//       });

//       let reactions;

//       if (existingReaction) {
//         // Delete the existing reaction
//         await this.prismaService.message_reactions.delete({
//           where: { id: existingReaction.id },
//         });
//       } else {
//         // Create a new reaction
//         await this.prismaService.message_reactions.create({
//           data: {
//             message_id: messageId,
//             user_id: userId,
//             emoji_type: emoji,
//             created_at: new Date(),
//           },
//         });
//       }

//       // Fetch updated reactions for the message
//       reactions = await this.prismaService.message_reactions.findMany({
//         where: { message_id: messageId },
//         select: {
//           id: true,
//           emoji_type: true,
//           user_id: true,
//           created_at: true,
//           users: {
//             select: {
//               username: true,
//             },
//           },
//         },
//       });

//       return {
//         messageId,
//         reactions: reactions.map((reaction) => ({
//           id: reaction.id,
//           emoji_type: reaction.emoji_type,
//           user_id: reaction.user_id,
//           username: reaction.users.username,
//           created_at: reaction.created_at.toISOString(),
//         })),
//       };
//     } catch (error) {
//       console.error('Toggle message reaction error:', error);
//       throw new BadRequestException('Failed to toggle reaction: ' + error.message);
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
          message_reactions: {
            select: {
              id: true,
              emoji_type: true,
              user_id: true,
              created_at: true,
              users: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      });

      const profilePicture = message.users?.profile
        ? await this.getSignedImageUrl(message.users.profile)
        : null;

      // Calculate reaction counts
      const reactionCounts = message.message_reactions.reduce((acc, reaction) => {
        acc[reaction.emoji_type] = (acc[reaction.emoji_type] || 0) + 1;
        return acc;
      }, {});

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
          reactions: message.message_reactions.map((reaction) => ({
            id: reaction.id,
            emoji_type: reaction.emoji_type,
            user_id: reaction.user_id,
            username: reaction.users.username,
            created_at: reaction.created_at.toISOString(),
          })),
          reaction_counts: reactionCounts,
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
          message_reactions: {
            select: {
              id: true,
              emoji_type: true,
              user_id: true,
              created_at: true,
              users: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      });

      const mappedMessages = await Promise.all(
        messages.map(async (msg) => {
          const profilePicture = msg.users?.profile
            ? await this.getSignedImageUrl(msg.users.profile)
            : null;
          
          // Calculate reaction counts
          const reactionCounts = msg.message_reactions.reduce((acc, reaction) => {
            acc[reaction.emoji_type] = (acc[reaction.emoji_type] || 0) + 1;
            return acc;
          }, {});

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
            reactions: msg.message_reactions.map((reaction) => ({
              id: reaction.id,
              emoji_type: reaction.emoji_type,
              user_id: reaction.user_id,
              username: reaction.users.username,
              created_at: reaction.created_at.toISOString(),
            })),
            reaction_counts: reactionCounts,
          };
        })
      );

      return mappedMessages.reverse();
    } catch (error) {
      console.error('Get community messages error:', error);
      throw new BadRequestException('Failed to get community messages: ' + error.message);
    }
  }

  async getTopReactedMessages() {
    try {
      const messages = await this.prismaService.community_messages.findMany({
        include: {
          users: {
            select: {
              username: true,
              profile: true,
            },
          },
          message_reactions: {
            select: {
              id: true,
              emoji_type: true,
              user_id: true,
              created_at: true,
              users: {
                select: {
                  username: true,
                },
              },
            },
          },
          _count: {
            select: {
              message_reactions: true,
            },
          },
        },
        orderBy: {
          message_reactions: {
            _count: 'desc',
          },
        },
        take: 4,
      });

      const mappedMessages = await Promise.all(
        messages.map(async (msg) => {
          const profilePicture = msg.users?.profile
            ? await this.getSignedImageUrl(msg.users.profile)
            : null;
          
          // Calculate reaction counts
          const reactionCounts = msg.message_reactions.reduce((acc, reaction) => {
            acc[reaction.emoji_type] = (acc[reaction.emoji_type] || 0) + 1;
            return acc;
          }, {});

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
            reactions: msg.message_reactions.map((reaction) => ({
              id: reaction.id,
              emoji_type: reaction.emoji_type,
              user_id: reaction.user_id,
              username: reaction.users.username,
              created_at: reaction.created_at.toISOString(),
            })),
            reaction_counts: reactionCounts,
            total_reactions: msg._count.message_reactions,
          };
        })
      );

      return {
        message: 'Top reacted messages retrieved successfully',
        data: mappedMessages,
      };
    } catch (error) {
      console.error('Get top reacted messages error:', error);
      throw new BadRequestException('Failed to get top reacted messages: ' + error.message);
    }
  }

  async toggleMessageReaction(data: { messageId: number; userId: number; emoji: string }) {
    try {
      const { messageId, userId, emoji } = data;

      // Validate inputs
      if (!messageId || !userId || !emoji) {
        throw new BadRequestException('Missing required fields: messageId, userId, or emoji');
      }

      // Check if message exists
      const message = await this.prismaService.community_messages.findUnique({
        where: { id: messageId },
      });
      if (!message) {
        throw new BadRequestException('Message not found');
      }

      // Check if user exists
      const user = await this.prismaService.users.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Check if reaction exists
      const existingReaction = await this.prismaService.message_reactions.findFirst({
        where: {
          message_id: messageId,
          user_id: userId,
          emoji_type: emoji,
        },
      });

      let reactions;

      if (existingReaction) {
        // Delete the existing reaction
        await this.prismaService.message_reactions.delete({
          where: { id: existingReaction.id },
        });
      } else {
        // Create a new reaction
        await this.prismaService.message_reactions.create({
          data: {
            message_id: messageId,
            user_id: userId,
            emoji_type: emoji,
            created_at: new Date(),
          },
        });
      }

      // Fetch updated reactions for the message
      reactions = await this.prismaService.message_reactions.findMany({
        where: { message_id: messageId },
        select: {
          id: true,
          emoji_type: true,
          user_id: true,
          created_at: true,
          users: {
            select: {
              username: true,
            },
          },
        },
      });

      // Calculate reaction counts
      const reactionCounts = reactions.reduce((acc, reaction) => {
        acc[reaction.emoji_type] = (acc[reaction.emoji_type] || 0) + 1;
        return acc;
      }, {});

      return {
        messageId,
        reactions: reactions.map((reaction) => ({
          id: reaction.id,
          emoji_type: reaction.emoji_type,
          user_id: reaction.user_id,
          username: reaction.users.username,
          created_at: reaction.created_at.toISOString(),
        })),
        reaction_counts: reactionCounts,
      };
    } catch (error) {
      console.error('Toggle message reaction error:', error);
      throw new BadRequestException('Failed to toggle reaction: ' + error.message);
    }
  }

  async deleteMessageReaction(data: { reactionId: number; userId: number }) {
    try {
      const { reactionId, userId } = data;

      // Validate inputs
      if (!reactionId || !userId) {
        throw new BadRequestException('Missing required fields: reactionId or userId');
      }

      // Check if reaction exists and belongs to the user
      const reaction = await this.prismaService.message_reactions.findFirst({
        where: {
          id: reactionId,
          user_id: userId,
        },
        select: {
          message_id: true,
        },
      });

      if (!reaction) {
        throw new BadRequestException('Reaction not found or not authorized');
      }

      // Delete the reaction
      await this.prismaService.message_reactions.delete({
        where: { id: reactionId },
      });

      // Fetch updated reactions for the message
      const reactions = await this.prismaService.message_reactions.findMany({
        where: { message_id: reaction.message_id },
        select: {
          id: true,
          emoji_type: true,
          user_id: true,
          created_at: true,
          users: {
            select: {
              username: true,
            },
          },
        },
      });

      // Calculate reaction counts
      const reactionCounts = reactions.reduce((acc, reaction) => {
        acc[reaction.emoji_type] = (acc[reaction.emoji_type] || 0) + 1;
        return acc;
      }, {});

      return {
        messageId: reaction.message_id,
        reactions: reactions.map((reaction) => ({
          id: reaction.id,
          emoji_type: reaction.emoji_type,
          user_id: reaction.user_id,
          username: reaction.users.username,
          created_at: reaction.created_at.toISOString(),
        })),
        reaction_counts: reactionCounts,
      };
    } catch (error) {
      console.error('Delete message reaction error:', error);
      throw new BadRequestException('Failed to delete reaction: ' + error.message);
    }
  }

  async updateMessageReaction(data: { reactionId: number; userId: number; newEmoji: string }) {
    try {
      const { reactionId, userId, newEmoji } = data;

      // Validate inputs
      if (!reactionId || !userId || !newEmoji) {
        throw new BadRequestException('Missing required fields: reactionId, userId, or newEmoji');
      }

      // Check if reaction exists and belongs to the user
      const reaction = await this.prismaService.message_reactions.findFirst({
        where: {
          id: reactionId,
          user_id: userId,
        },
        select: {
          message_id: true,
        },
      });

      if (!reaction) {
        throw new BadRequestException('Reaction not found or not authorized');
      }

      // Update the reaction
      await this.prismaService.message_reactions.update({
        where: { id: reactionId },
        data: {
          emoji_type: newEmoji,
          created_at: new Date(), // Update timestamp
        },
      });

      // Fetch updated reactions for the message
      const reactions = await this.prismaService.message_reactions.findMany({
        where: { message_id: reaction.message_id },
        select: {
          id: true,
          emoji_type: true,
          user_id: true,
          created_at: true,
          users: {
            select: {
              username: true,
            },
          },
        },
      });

      // Calculate reaction counts
      const reactionCounts = reactions.reduce((acc, reaction) => {
        acc[reaction.emoji_type] = (acc[reaction.emoji_type] || 0) + 1;
        return acc;
      }, {});

      return {
        messageId: reaction.message_id,
        reactions: reactions.map((reaction) => ({
          id: reaction.id,
          emoji_type: reaction.emoji_type,
          user_id: reaction.user_id,
          username: reaction.users.username,
          created_at: reaction.created_at.toISOString(),
        })),
        reaction_counts: reactionCounts,
      };
    } catch (error) {
      console.error('Update message reaction error:', error);
      throw new BadRequestException('Failed to update reaction: ' + error.message);
    }
  }

  
}
