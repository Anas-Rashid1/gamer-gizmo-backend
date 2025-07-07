
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Service } from 'src/utils/s3.service';


@Injectable()
export class ChatService {
  private s3Client: S3Client;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async getSignedImageUrl(key: string): Promise<string | null> {
    try {
      return await this.s3Service.get_image_url(key);
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

  
  async banUserFromCommunityChat(communityChatId: number, userId: number, requesterId: number) {
    try {
      const validChatId = Number(communityChatId);
      const validUserId = Number(userId);
      const validRequesterId = Number(requesterId);

      if (isNaN(validChatId) || validChatId <= 0) {
        throw new BadRequestException('Invalid community chat ID');
      }
      if (isNaN(validUserId) || validUserId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }
      if (isNaN(validRequesterId) || validRequesterId <= 0) {
        throw new BadRequestException('Invalid requester ID');
      }

      const chat = await this.prismaService.community_chat.findUnique({
        where: { id: validChatId },
        include: { admins: true },
      });

      if (!chat) {
        throw new BadRequestException('Community chat not found');
      }

      if (chat.creator_id !== validRequesterId && !chat.admins.some((admin) => admin.id === validRequesterId)) {
        throw new BadRequestException('User is not authorized to ban users from this community chat');
      }

      const userExists = await this.prismaService.users.findUnique({
        where: { id: validUserId },
      });

      if (!userExists) {
        throw new BadRequestException('User to ban does not exist');
      }

      if (chat.creator_id === validUserId) {
        throw new BadRequestException('Cannot ban the creator of the community chat');
      }

      // Mark existing messages from the banned user as is_banned
      await this.prismaService.community_messages.updateMany({
        where: {
          community_chat_id: validChatId,
          sender_id: validUserId,
          is_banned: false,
        },
        data: {
          is_banned: true,
        },
      });

      // Add user to banned_users relation
      await this.prismaService.community_chat.update({
        where: { id: validChatId },
        data: {
          banned_users: {
            connect: { id: validUserId },
          },
        },
      });

      return { message: 'User banned successfully' };
    } catch (error) {
      console.error('Ban user from community chat error:', error);
      throw new BadRequestException('Failed to ban user: ' + error.message);
    }
  }

  async unbanUserFromCommunityChat(communityChatId: number, userId: number, requesterId: number) {
    try {
      const validChatId = Number(communityChatId);
      const validUserId = Number(userId);
      const validRequesterId = Number(requesterId);

      if (isNaN(validChatId) || validChatId <= 0) {
        throw new BadRequestException('Invalid community chat ID');
      }
      if (isNaN(validUserId) || validUserId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }
      if (isNaN(validRequesterId) || validRequesterId <= 0) {
        throw new BadRequestException('Invalid requester ID');
      }

      const chat = await this.prismaService.community_chat.findUnique({
        where: { id: validChatId },
        include: { admins: true },
      });

      if (!chat) {
        throw new BadRequestException('Community chat not found');
      }

      if (chat.creator_id !== validRequesterId && !chat.admins.some((admin) => admin.id === validRequesterId)) {
        throw new BadRequestException('User is not authorized to unban users from this community chat');
      }

      const userExists = await this.prismaService.users.findUnique({
        where: { id: validUserId },
      });

      if (!userExists) {
        throw new BadRequestException('User to unban does not exist');
      }

      // Unmark messages as banned
      await this.prismaService.community_messages.updateMany({
        where: {
          community_chat_id: validChatId,
          sender_id: validUserId,
          is_banned: true,
        },
        data: {
          is_banned: false,
        },
      });

      // Remove user from banned_users relation
      await this.prismaService.community_chat.update({
        where: { id: validChatId },
        data: {
          banned_users: {
            disconnect: { id: validUserId },
          },
        },
      });

      return { message: 'User unbanned successfully' };
    } catch (error) {
      console.error('Unban user from community chat error:', error);
      throw new BadRequestException('Failed to unban user: ' + error.message);
    }
  }

  async assignCommunityChatAdmin(communityChatId: number, userId: number, requesterId: number) {
    try {
      const validChatId = Number(communityChatId);
      const validUserId = Number(userId);
      const validRequesterId = Number(requesterId);

      if (isNaN(validChatId) || validChatId <= 0) {
        throw new BadRequestException('Invalid community chat ID');
      }
      if (isNaN(validUserId) || validUserId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }
      if (isNaN(validRequesterId) || validRequesterId <= 0) {
        throw new BadRequestException('Invalid requester ID');
      }

      const chat = await this.prismaService.community_chat.findUnique({
        where: { id: validChatId },
        include: { admins: true },
      });

      if (!chat) {
        throw new BadRequestException('Community chat not found');
      }

      if (chat.creator_id !== validRequesterId) {
        throw new BadRequestException('Only the creator can assign admins');
      }

      const userExists = await this.prismaService.users.findUnique({
        where: { id: validUserId },
      });

      if (!userExists) {
        throw new BadRequestException('User to assign as admin does not exist');
      }

      if (chat.admins.some((admin) => admin.id === validUserId)) {
        throw new BadRequestException('User is already an admin');
      }

      await this.prismaService.community_chat.update({
        where: { id: validChatId },
        data: {
          admins: {
            connect: { id: validUserId },
          },
        },
      });

      return { message: 'User assigned as admin successfully' };
    } catch (error) {
      console.error('Assign community chat admin error:', error);
      throw new BadRequestException('Failed to assign admin: ' + error.message);
    }
  }

  async deleteCommunityMessage(messageId: number, requesterId: number) {
    try {
      const validMessageId = Number(messageId);
      const validRequesterId = Number(requesterId);

      if (isNaN(validMessageId) || validMessageId <= 0) {
        throw new BadRequestException('Invalid message ID');
      }
      if (isNaN(validRequesterId) || validRequesterId <= 0) {
        throw new BadRequestException('Invalid requester ID');
      }

      const message = await this.prismaService.community_messages.findUnique({
        where: { id: validMessageId },
        include: { community_chat: { include: { admins: true } } },
      });

      if (!message) {
        throw new BadRequestException('Message not found');
      }

      if (
        message.community_chat.creator_id !== validRequesterId &&
        !message.community_chat.admins.some((admin) => admin.id === validRequesterId)
      ) {
        throw new BadRequestException('User is not authorized to delete messages in this community chat');
      }

      await this.prismaService.community_messages.delete({
        where: { id: validMessageId },
      });

      return { message: 'Message deleted successfully' };
    } catch (error) {
      console.error('Delete community message error:', error);
      throw new BadRequestException('Failed to delete message: ' + error.message);
    }
  }

  async createCommunityMessage(data: { content: string; is_admin: boolean; sender_id: number; community_chat_id: number }) {
    try {
      const validSenderId = Number(data.sender_id);
      const validChatId = Number(data.community_chat_id);

      if (isNaN(validSenderId) || validSenderId <= 0) {
        throw new BadRequestException('Invalid sender ID');
      }
      if (isNaN(validChatId) || validChatId <= 0) {
        throw new BadRequestException('Invalid community chat ID');
      }

      const chat = await this.prismaService.community_chat.findUnique({
        where: { id: validChatId },
        include: { banned_users: true },
      });

      if (!chat) {
        throw new BadRequestException('Community chat not found');
      }

      if (chat.banned_users.some((user) => user.id === validSenderId)) {
        throw new BadRequestException('User is banned from this community chat');
      }

      const userExists = await this.prismaService.users.findUnique({
        where: { id: validSenderId },
      });

      if (!userExists && !data.is_admin) {
        throw new BadRequestException('Sender user does not exist');
      }

      const adminExists = data.is_admin
        ? await this.prismaService.admin.findUnique({
            where: { id: validSenderId },
          })
        : true;

      if (!adminExists) {
        throw new BadRequestException('Admin does not exist');
      }

      const dataToSend = {
        content: data.content,
        is_admin: Boolean(data.is_admin),
        community_chat_id: validChatId,
        is_banned: false,
        ...(data.is_admin ? { admin_id: validSenderId } : { sender_id: validSenderId }),
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
          admin: {
            select: {
              name: true,
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
          community_chat: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const profilePicture = message.users?.profile
        ? await this.getSignedImageUrl(message.users.profile)
        : null;

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
          user_admin_id: message.user_admin_id,
          community_chat_id: message.community_chat_id,
          community_chat_name: message.community_chat.name,
          created_at: message.created_at.toISOString(),
          users: {
            username: message.users?.username || message.admin?.name || 'Unknown',
            profile_picture: profilePicture,
          },
          reactions: message.message_reactions.map((reaction) => ({
            id: reaction.id,
            emoji_type: reaction.emoji_type,
            user_id: reaction.user_id,
            username: reaction.users?.username || 'Unknown',
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

  async getCommunityMessages(communityChatId: number, userId: number, options: { beforeId?: number } = {}) {
  try {
    const validChatId = Number(communityChatId);
    const validUserId = Number(userId);

    if (isNaN(validChatId) || validChatId <= 0) {
      throw new BadRequestException('Invalid community chat ID');
    }
    if (isNaN(validUserId) || validUserId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    const chat = await this.prismaService.community_chat.findUnique({
      where: { id: validChatId },
      include: { banned_users: true },
    });

    if (!chat) {
      throw new BadRequestException('Community chat not found');
    }

    if (chat.banned_users.some((user) => user.id === validUserId)) {
      throw new BadRequestException('User is banned from this community chat');
    }

    const messages = await this.prismaService.community_messages.findMany({
      where: {
        community_chat_id: validChatId,
        is_banned: false,
        ...(options.beforeId ? { id: { lt: options.beforeId } } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 10,
      include: {
        users: {
          select: {
            username: true,
            profile: true,
          },
        },
        admin: {
          select: {
            name: true,
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
          user_admin_id: msg.user_admin_id,
          community_chat_id: msg.community_chat_id,
          created_at: msg.created_at.toISOString(),
          users: {
            username: msg.users?.username || msg.admin?.name || 'Unknown',
            profile_picture: profilePicture,
          },
          reactions: msg.message_reactions.map((reaction) => ({
            id: reaction.id,
            emoji_type: reaction.emoji_type,
            user_id: reaction.user_id,
            username: reaction.users?.username || 'Unknown',
            created_at: reaction.created_at.toISOString(),
          })),
          reaction_counts: reactionCounts,
        };
      }),
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

  async getCommunityChatMessages(communityChatId: number, userId: number, options: { beforeId?: number } = {}) {
    try {
      const validChatId = Number(communityChatId);
      const validUserId = Number(userId);

      if (isNaN(validChatId) || validChatId <= 0) {
        throw new BadRequestException('Invalid community chat ID');
      }
      if (isNaN(validUserId) || validUserId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }

      const chat = await this.prismaService.community_chat.findUnique({
        where: { id: validChatId },
        include: { banned_users: true },
      });

      if (!chat) {
        throw new BadRequestException('Community chat not found');
      }

      if (chat.banned_users.some((user) => user.id === validUserId)) {
        throw new BadRequestException('User is banned from this community chat');
      }

      const messages = await this.prismaService.community_messages.findMany({
        where: {
          community_chat_id: validChatId,
          is_banned: false,
          ...(options.beforeId ? { id: { lt: options.beforeId } } : {}),
        },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          users: {
            select: {
              username: true,
              profile: true,
            },
          },
          admin: {
            select: {
              name: true,
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
            user_admin_id: msg.user_admin_id,
            community_chat_id: msg.community_chat_id,
            created_at: msg.created_at.toISOString(),
            users: {
              username: msg.users?.username || msg.admin?.name || 'Unknown',
              profile_picture: profilePicture,
            },
            reactions: msg.message_reactions.map((reaction) => ({
              id: reaction.id,
              emoji_type: reaction.emoji_type,
              user_id: reaction.user_id,
              username: reaction.users?.username || 'Unknown',
              created_at: reaction.created_at.toISOString(),
            })),
            reaction_counts: reactionCounts,
          };
        }),
      );

      return mappedMessages.reverse();
    } catch (error) {
      console.error('Get community chat messages error:', error);
      throw new BadRequestException('Failed to get community chat messages: ' + error.message);
    }
  }

  async getCommunityChats(limit: number = 4, userId: number, includeLastMessage: boolean = true) {
    try {
      const validUserId = Number(userId);
      if (isNaN(validUserId) || validUserId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }

      const chats = await this.prismaService.community_chat.findMany({
        where: {
          banned_users: {
            none: { id: validUserId },
          },
        },
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          users: {
            select: { id: true, username: true, profile: true },
          },
          admins: {
            select: { id: true, username: true, profile: true },
          },
          community_messages: includeLastMessage
            ? {
                where: { is_banned: false },
                take: 1,
                orderBy: { created_at: 'desc' },
                include: {
                  users: {
                    select: { username: true, profile: true },
                  },
                  admin: {
                    select: { name: true },
                  },
                },
              }
            : false,
        },
      });

      const chatsWithProfilePictures = await Promise.all(
        chats.map(async (chat) => {
          const creatorProfilePicture = chat.users?.profile
            ? await this.getSignedImageUrl(chat.users.profile)
            : null;

          const adminProfilePictures = await Promise.all(
            chat.admins.map(async (admin) => ({
              id: admin.id,
              username: admin.username,
              profile_picture: admin.profile ? await this.getSignedImageUrl(admin.profile) : null,
            })),
          );

          type CommunityMessageWithUsers = {
            id: number;
            content: string;
            created_at: Date;
            users?: { username: string; profile?: string | null };
            admin?: { name: string };
          };

          const lastMessage = chat.community_messages?.[0] as CommunityMessageWithUsers | undefined;

          if (lastMessage && !lastMessage.users && !lastMessage.admin) {
            console.warn(`Missing users or admin for message ID ${lastMessage.id} in chat ID ${chat.id}`);
          }

          const messageProfilePicture = lastMessage?.users?.profile
            ? await this.getSignedImageUrl(lastMessage.users.profile)
            : null;

          return {
            id: chat.id,
            name: chat.name,
            description: chat.description,
            wallpaper: chat.wallpaper ? await this.getSignedImageUrl(chat.wallpaper) : null,
            creator: chat.users
              ? {
                  id: chat.users.id,
                  username: chat.users.username,
                  profile_picture: creatorProfilePicture,
                }
              : null,
            admins: adminProfilePictures,
            latest_message: lastMessage
              ? {
                  id: lastMessage.id,
                  content: lastMessage.content,
                  created_at: lastMessage.created_at.toISOString(),
                  users: lastMessage.users
                    ? {
                        username: lastMessage.users.username || lastMessage.admin?.name || 'Unknown User',
                        profile_picture: messageProfilePicture,
                      }
                    : { username: lastMessage.admin?.name || 'Unknown User', profile_picture: null },
                }
              : null,
          };
        }),
      );

      return {
        message: 'Community chats retrieved successfully',
        data: chatsWithProfilePictures,
      };
    } catch (error) {
      console.error('Fetch community chats error:', error);
      throw new BadRequestException('Failed to fetch community chats: ' + error.message);
    }
  }

  async toggleMessageReaction(data: { messageId: number; userId: number; emoji: string }) {
    try {
      const { messageId, userId, emoji } = data;

      if (!messageId || !userId || !emoji) {
        throw new BadRequestException('Missing required fields: messageId, userId, or emoji');
      }

      const message = await this.prismaService.community_messages.findUnique({
        where: { id: messageId },
        include: { community_chat: { include: { banned_users: true } } },
      });

      if (!message) {
        throw new BadRequestException('Message not found');
      }

      if (message.is_banned) {
        throw new BadRequestException('Cannot react to a banned message');
      }

      if (message.community_chat.banned_users.some((user) => user.id === userId)) {
        throw new BadRequestException('User is banned from this community chat');
      }

      const user = await this.prismaService.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const existingReaction = await this.prismaService.message_reactions.findFirst({
        where: {
          message_id: messageId,
          user_id: userId,
          emoji_type: emoji,
        },
      });

      let reactions;

      if (existingReaction) {
        await this.prismaService.message_reactions.delete({
          where: { id: existingReaction.id },
        });
      } else {
        await this.prismaService.message_reactions.create({
          data: {
            message_id: messageId,
            user_id: userId,
            emoji_type: emoji,
            created_at: new Date(),
          },
        });
      }

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

      if (!reactionId || !userId) {
        throw new BadRequestException('Missing required fields: reactionId or userId');
      }

      const reaction = await this.prismaService.message_reactions.findFirst({
        where: {
          id: reactionId,
          user_id: userId,
        },
        select: {
          message_id: true,
          community_messages: {
            include: { community_chat: { include: { banned_users: true } } },
          },
        },
      });

      if (!reaction) {
        throw new BadRequestException('Reaction not found or not authorized');
      }

      if (reaction.community_messages.is_banned) {
        throw new BadRequestException('Cannot modify reactions on a banned message');
      }

      if (reaction.community_messages.community_chat.banned_users.some((user) => user.id === userId)) {
        throw new BadRequestException('User is banned from this community chat');
      }

      await this.prismaService.message_reactions.delete({
        where: { id: reactionId },
      });

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

      if (!reactionId || !userId || !newEmoji) {
        throw new BadRequestException('Missing required fields: reactionId, userId, or newEmoji');
      }

      const reaction = await this.prismaService.message_reactions.findFirst({
        where: {
          id: reactionId,
          user_id: userId,
        },
        select: {
          message_id: true,
          community_messages: {
            include: { community_chat: { include: { banned_users: true } } },
          },
        },
      });

      if (!reaction) {
        throw new BadRequestException('Reaction not found or not authorized');
      }

      if (reaction.community_messages.is_banned) {
        throw new BadRequestException('Cannot modify reactions on a banned message');
      }

      if (reaction.community_messages.community_chat.banned_users.some((user) => user.id === userId)) {
        throw new BadRequestException('User is banned from this community chat');
      }

      await this.prismaService.message_reactions.update({
        where: { id: reactionId },
        data: {
          emoji_type: newEmoji,
          created_at: new Date(),
        },
      });

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

   

  async createCommunityChat(name: string, description: string | undefined, file: Express.Multer.File | undefined, creatorId: number) {
    try {
      if (!name || name.trim().length === 0) {
        throw new BadRequestException('Name cannot be empty');
      }

      const validCreatorId = Number(creatorId);
      if (isNaN(validCreatorId) || validCreatorId <= 0) {
        throw new BadRequestException('Invalid creator ID');
      }

      const userExists = await this.prismaService.users.findUnique({
        where: { id: validCreatorId },
      });

      if (!userExists) {
        throw new BadRequestException('Creator user does not exist');
      }

      let wallpaperKey: string | null = null;
      if (file) {
        const uploadResult = await this.s3Service.upload_file(file);
        wallpaperKey = uploadResult.Key;
      }

      const communityChat = await this.prismaService.community_chat.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          wallpaper: wallpaperKey,
          creator_id: validCreatorId,
          created_at: new Date(),
          admins: {
            connect: [{ id: validCreatorId }],
          },
        },
      });

      return {
        message: 'Community chat created successfully',
        data: {
          id: communityChat.id,
          name: communityChat.name,
          description: communityChat.description,
          wallpaper: wallpaperKey ? await this.getSignedImageUrl(wallpaperKey) : null,
          creator_id: communityChat.creator_id,
          created_at: communityChat.created_at.toISOString(),
        },
      };
    } catch (error) {
      console.error('Create community chat error:', error);
      throw new BadRequestException('Failed to create community chat: ' + error.message);
    }
  }

  async updateCommunityChatWallpaper(communityChatId: number, file: Express.Multer.File | undefined, userId: number) {
    try {
      const validChatId = Number(communityChatId);
      if (isNaN(validChatId) || validChatId <= 0) {
        throw new BadRequestException('Invalid community chat ID');
      }

      const validUserId = Number(userId);
      if (isNaN(validUserId) || validUserId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }

      const chat = await this.prismaService.community_chat.findUnique({
        where: { id: validChatId },
        include: { admins: true },
      });

      if (!chat) {
        throw new BadRequestException('Community chat not found');
      }

      if (chat.creator_id !== validUserId && !chat.admins.some((admin) => admin.id === validUserId)) {
        throw new BadRequestException('User is not authorized to update this community chat');
      }

      let wallpaperKey: string | null = chat.wallpaper;
      if (file) {
        if (chat.wallpaper) {
          await this.s3Service.deleteFileByKey(chat.wallpaper);
        }
        const uploadResult = await this.s3Service.upload_file(file);
        wallpaperKey = uploadResult.Key;
      } else if (chat.wallpaper) {
        await this.s3Service.deleteFileByKey(chat.wallpaper);
        wallpaperKey = null;
      }

      const updatedChat = await this.prismaService.community_chat.update({
        where: { id: validChatId },
        data: {
          wallpaper: wallpaperKey,
        },
      });

      return {
        message: 'Community chat wallpaper updated successfully',
        data: {
          id: updatedChat.id,
          name: updatedChat.name,
          description: updatedChat.description,
          wallpaper: wallpaperKey ? await this.getSignedImageUrl(wallpaperKey) : null,
          creator_id: updatedChat.creator_id,
          created_at: updatedChat.created_at.toISOString(),
        },
      };
    } catch (error) {
      console.error('Update community chat wallpaper error:', error);
      throw new BadRequestException('Failed to update community chat wallpaper: ' + error.message);
    }
  }

  async deleteCommunityChat(communityChatId: number, requesterId: number) {
  try {
    const validChatId = Number(communityChatId);
    const validRequesterId = Number(requesterId);

    if (isNaN(validChatId) || validChatId <= 0) {
      throw new BadRequestException('Invalid community chat ID');
    }
    if (isNaN(validRequesterId) || validRequesterId <= 0) {
      throw new BadRequestException('Invalid requester ID');
    }

    const chat = await this.prismaService.community_chat.findUnique({
      where: { id: validChatId },
      include: { admins: true },
    });

    if (!chat) {
      throw new BadRequestException('Community chat not found');
    }

    const isAdmin = await this.prismaService.admin.findUnique({
      where: { id: validRequesterId },
    });

    if (
      !isAdmin &&
      chat.creator_id !== validRequesterId &&
      !chat.admins.some((admin) => admin.id === validRequesterId)
    ) {
      throw new BadRequestException('User is not authorized to delete this community chat');
    }

    await this.prismaService.$transaction([
      this.prismaService.message_reactions.deleteMany({
        where: {
          community_messages: { community_chat_id: validChatId },
        },
      }),
      this.prismaService.community_messages.deleteMany({
        where: { community_chat_id: validChatId },
      }),
      this.prismaService.community_chat.update({
        where: { id: validChatId },
        data: {
          admins: { set: [] },
          banned_users: { set: [] },
        },
      }),
      this.prismaService.community_chat.delete({
        where: { id: validChatId },
      }),
    ]);

    if (chat.wallpaper) {
      await this.s3Service.deleteFileByKey(chat.wallpaper);
    }

    return { message: 'Community chat deleted successfully' };
  } catch (error) {
    console.error('Delete community chat error:', error);
    throw new BadRequestException('Failed to delete community chat: ' + error.message);
  }
}
  async getCommunityChat(communityChatId: number, userId: number) {
  try {
    const validChatId = Number(communityChatId);
    const validUserId = Number(userId);

    if (isNaN(validChatId) || validChatId <= 0) {
      throw new BadRequestException('Invalid community chat ID');
    }
    if (isNaN(validUserId) || validUserId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    const chat = await this.prismaService.community_chat.findUnique({
      where: { id: validChatId },
      include: {
        users: {
          select: { id: true, username: true, profile: true },
        },
        admins: {
          select: { id: true, username: true, profile: true },
        },
        banned_users: {
          select: { id: true, username: true, profile: true },
        },
      },
    });

    if (!chat) {
      throw new BadRequestException('Community chat not found');
    }

    if (chat.banned_users.some((user) => user.id === validUserId)) {
      throw new BadRequestException('User is banned from this community chat');
    }

    const wallpaperUrl = chat.wallpaper
      ? await this.getSignedImageUrl(chat.wallpaper)
      : null;

    const admins = await Promise.all(
      chat.admins.map(async (admin) => ({
        id: admin.id,
        username: admin.username,
        profile_picture: admin.profile ? await this.getSignedImageUrl(admin.profile) : null,
      })),
    );

    const bannedUsers = await Promise.all(
      chat.banned_users.map(async (user) => ({
        id: user.id,
        username: user.username,
        profile_picture: user.profile ? await this.getSignedImageUrl(user.profile) : null,
      })),
    );

    return {
      message: 'Community chat retrieved successfully',
      data: {
        id: chat.id,
        name: chat.name,
        description: chat.description,
        wallpaper: wallpaperUrl,
        creator_id: chat.creator_id,
        created_at: chat.created_at.toISOString(),
        admins,
        banned_users: bannedUsers,
      },
    };
  } catch (error) {
    console.error('Get community chat error:', error);
    throw new BadRequestException('Failed to retrieve community chat: ' + error.message);
  }
}
 async getTopCommunityChatsByMessages(limit: number, userId: number) {
    try {
            console.log('abc')

      const validUserId = Number(userId);
      const validLimit = Number(limit);

      if (isNaN(validUserId) || validUserId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }
      if (isNaN(validLimit) || validLimit <= 0) {
        throw new BadRequestException('Invalid limit parameter');
      }
      const chats = await this.prismaService.community_chat.findMany({
        where: {
          banned_users: {
            none: { id: validUserId },
          },
        },
        include: {
          users: {
            select: { id: true, username: true, profile: true },
          },
          community_messages: {
            where: { is_banned: false },
            take: 1,
            orderBy: { created_at: 'desc' },
            include: {
              users: {
                select: { username: true, profile: true },
              },
              admin: {
                select: { name: true },
              },
            },
          },
          _count: {
            select: { community_messages: { where: { is_banned: false } } },
          },
        },
        orderBy: {
          community_messages: {
            _count: 'desc',
          },
        },
        take: validLimit,
      });

      const chatsWithDetails = await Promise.all(
        chats.map(async (chat) => {
          const wallpaperUrl = chat.wallpaper
            ? await this.getSignedImageUrl(chat.wallpaper)
            : null;

          const latestMessage = chat.community_messages[0];
          const senderProfilePicture = latestMessage?.users?.profile
            ? await this.getSignedImageUrl(latestMessage.users.profile)
            : null;

          return {
            id: chat.id,
            name: chat.name,
            description: chat.description,
            wallpaper: wallpaperUrl,
            creator_id: chat.creator_id,
            created_at: chat.created_at.toISOString(),
            message_count: chat._count.community_messages,
            latest_message: latestMessage
              ? {
                  id: latestMessage.id,
                  content: latestMessage.content,
                  created_at: latestMessage.created_at.toISOString(),
                  is_admin: latestMessage.is_admin,
                  sender_id: latestMessage.sender_id,
                  admin_id: latestMessage.admin_id,
                  user_admin_id: latestMessage.user_admin_id,
                  users: {
                    username: latestMessage.users?.username || latestMessage.admin?.name || 'Unknown',
                    profile_picture: senderProfilePicture,
                  },
                }
              : null,
          };
        }),
      );

      return {
        message: 'Top community chats retrieved successfully',
        data: chatsWithDetails,
      };
    } catch (error) {
      console.error('Get top community chats by messages error:', error);
      throw new BadRequestException('Failed to retrieve top community chats: ' + error.message);
    }
  }
  
   async getBannedUsers(communityChatId: number, userId: number) {
    try {
      console.log('getBannedUsers called with:', { communityChatId, userId });

      const validChatId = Number(communityChatId);
      const validUserId = Number(userId);

      if (isNaN(validChatId) || validChatId <= 0) {
        throw new BadRequestException('Invalid community chat ID');
      }
      if (isNaN(validUserId) || validUserId <= 0) {
        throw new BadRequestException('Invalid user ID');
      }

      // Check if the user is the creator or an admin of the chat
      const chat = await this.prismaService.community_chat.findFirst({
        where: {
          id: validChatId,
          OR: [
            { creator_id: validUserId },
            { admins: { some: { id: validUserId } } },
          ],
        },
        include: {
          banned_users: {
            select: {
              id: true,
              username: true,
              profile: true,
            },
          },
        },
      });

      if (!chat) {
        throw new BadRequestException('Community chat not found or user is not authorized');
      }

      const bannedUsersWithDetails = await Promise.all(
        chat.banned_users.map(async (user) => ({
          id: user.id,
          username: user.username,
          profile_picture: user.profile ? await this.getSignedImageUrl(user.profile) : null,
        })),
      );

      return {
        message: 'Banned users retrieved successfully',
        data: bannedUsersWithDetails,
      };
    } catch (error) {
      console.error('Get banned users error:', error);
      throw new BadRequestException('Failed to retrieve banned users: ' + error.message);
    }
  }

}