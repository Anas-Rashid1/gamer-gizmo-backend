
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatService } from './chat.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Chats')
@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<number, Socket> = new Map();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = parseInt(client.handshake.query.userId as string);
    if (isNaN(userId)) {
      client.disconnect();
      throw new BadRequestException('Invalid user ID');
    }
    this.connectedUsers.set(userId, client);
    console.log(`User ${userId} connected`);

    // Emit unread message counts and latest messages for buyers and sellers
    await this.emitBuyersAndSellersUpdate(userId, client);
  }

  handleDisconnect(client: Socket) {
    const userId = parseInt(client.handshake.query.userId as string);
    this.connectedUsers.delete(userId);
    console.log(`User ${userId} disconnected`);
  }

  @SubscribeMessage('sendMessage')
  @ApiOperation({
    summary: 'Send a message in a normal chat (WebSocket)',
    description: 'Sends a message to a normal chat and emits a `receiveMessage` event to both sender and receiver (if connected). The receiverId must be one of the chat’s users (user1_id or user2_id).',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent successfully, emitted as `receiveMessage` event to sender and receiver',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Message sent successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            chatId: { type: 'number', example: 1 },
            senderId: { type: 'number', example: 1 },
            messageText: { type: 'string', example: 'Hello!' },
            sentAt: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
            isRead: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid sender ID, chat ID, receiver ID, or message data' })
  @ApiResponse({ status: 404, description: 'Not Found - Chat or users not found' })
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: number; receiverId: number; messageText: string },
  ) {
    const senderId = parseInt(client.handshake.query.userId as string);
    if (isNaN(senderId)) {
      throw new BadRequestException('Invalid sender ID');
    }

    try {
      const chat = await this.prismaService.chats.findUnique({
        where: { id: payload.chatId },
        select: { id: true, user1_id: true, user2_id: true },
      });
      if (!chat) {
        throw new BadRequestException('Chat not found');
      }

      if (![chat.user1_id, chat.user2_id].includes(senderId)) {
        throw new BadRequestException('Sender is not a participant in this chat');
      }
      if (![chat.user1_id, chat.user2_id].includes(payload.receiverId)) {
        throw new BadRequestException('Receiver is not a participant in this chat');
      }

      const message = await this.prismaService.messages.create({
        data: {
          chat_id: payload.chatId,
          sender_id: senderId,
          message_text: payload.messageText,
          sent_at: new Date(),
          is_read: false,
        },
      });

      const messageData = {
        id: message.id,
        chatId: message.chat_id,
        senderId: message.sender_id,
        messageText: message.message_text,
        sentAt: message.sent_at.toISOString(),
        isRead: message.is_read,
      };

      const senderSocket = this.connectedUsers.get(senderId);
      const receiverSocket = this.connectedUsers.get(payload.receiverId);

      if (senderSocket) {
        senderSocket.emit('receiveMessage', messageData);
        await this.emitBuyersAndSellersUpdate(senderId, senderSocket);
      }
      if (receiverSocket) {
        receiverSocket.emit('receiveMessage', messageData);
        await this.emitBuyersAndSellersUpdate(payload.receiverId, receiverSocket);
      }

      return { message: 'Message sent successfully', data: messageData };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to send message');
    }
  }

  @SubscribeMessage('communitySendMessage')
  @ApiOperation({
    summary: 'Send a message in a specific community chat (WebSocket)',
    description: 'Sends a message to a specific community chat and broadcasts a `communityReceiveMessage` event to all connected clients. Users banned from the chat cannot send messages.',
  })
  @ApiResponse({
    status: 200,
    description: 'Community message sent successfully, emitted as `communityReceiveMessage` event',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        content: { type: 'string', example: 'Hello community!' },
        is_admin: { type: 'boolean', example: false },
        sender_id: { type: 'number', example: 1, nullable: true },
        admin_id: { type: 'number', example: null, nullable: true },
        user_admin_id: { type: 'number', example: null, nullable: true },
        community_chat_id: { type: 'number', example: 1 },
        created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:21:00.000Z' },
        users: {
          type: 'object',
          properties: {
            username: { type: 'string', example: 'john_doe' },
            profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
          },
        },
        reactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              emoji_type: { type: 'string', example: '👍' },
              user_id: { type: 'number', example: 1 },
              username: { type: 'string', example: 'john_doe' },
              created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:22:00.000Z' },
            },
          },
        },
        reaction_counts: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { '👍': 2, '❤️': 1 },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid sender ID, community chat ID, or user is banned' })
  async handleCommunitySendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content: string; is_admin: boolean; community_chat_id: number },
  ) {
    const senderId = parseInt(client.handshake.query.userId as string);
    if (isNaN(senderId)) {
      throw new BadRequestException('Invalid sender ID');
    }

    try {
      const result = await this.chatService.createCommunityMessage({
        content: payload.content,
        is_admin: payload.is_admin,
        sender_id: senderId,
        community_chat_id: payload.community_chat_id,
      });

      this.server.emit('communityReceiveMessage', result.data);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to send community message');
    }
  }

  @SubscribeMessage('communityFetchMessages')
  @ApiOperation({
    summary: 'Fetch latest messages for a specific community chat (WebSocket)',
    description: 'Fetches the latest 10 messages for a specific community chat and emits a `communityLoadMessages` event to the client. Excludes messages from banned users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Community messages retrieved successfully, emitted as `communityLoadMessages` event',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          content: { type: 'string', example: 'Hello community!' },
          is_admin: { type: 'boolean', example: false },
          sender_id: { type: 'number', example: 1, nullable: true },
          admin_id: { type: 'number', example: null, nullable: true },
          user_admin_id: { type: 'number', example: null, nullable: true },
          community_chat_id: { type: 'number', example: 1 },
          created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:21:00.000Z' },
          users: {
            type: 'object',
            properties: {
              username: { type: 'string', example: 'john_doe' },
              profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
            },
          },
          reactions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                emoji_type: { type: 'string', example: '👍' },
                user_id: { type: 'number', example: 1 },
                username: { type: 'string', example: 'john_doe' },
                created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:22:00.000Z' },
              },
            },
          },
          reaction_counts: {
            type: 'object',
            additionalProperties: { type: 'number' },
            example: { '👍': 2, '❤️': 1 },
          },
        },
      },
    },
  })
  async handleCommunityFetchMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { communityChatId: number },
  ) {
    const userId = parseInt(client.handshake.query.userId as string);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      const messages = await this.chatService.getCommunityChatMessages(payload.communityChatId, userId);
      client.emit('communityLoadMessages', messages);
      return { message: 'Community messages fetched successfully', data: messages };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch community messages');
    }
  }

  @SubscribeMessage('communityFetchMoreMessages')
  @ApiOperation({
    summary: 'Fetch older messages for a specific community chat (WebSocket)',
    description: 'Fetches up to 10 older messages before a specified message ID for a specific community chat and emits a `communityLoadMoreMessages` event. Excludes messages from banned users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Older community messages retrieved successfully, emitted as `communityLoadMoreMessages` event',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          content: { type: 'string', example: 'Hello community!' },
          is_admin: { type: 'boolean', example: false },
          sender_id: { type: 'number', example: 1, nullable: true },
          admin_id: { type: 'number', example: null, nullable: true },
          user_admin_id: { type: 'number', example: null, nullable: true },
          community_chat_id: { type: 'number', example: 1 },
          created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:21:00.000Z' },
          users: {
            type: 'object',
            properties: {
              username: { type: 'string', example: 'john_doe' },
              profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
            },
          },
          reactions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                emoji_type: { type: 'string', example: '👍' },
                user_id: { type: 'number', example: 1 },
                username: { type: 'string', example: 'john_doe' },
                created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:22:00.000Z' },
              },
            },
          },
          reaction_counts: {
            type: 'object',
            additionalProperties: { type: 'number' },
            example: { '👍': 2, '❤️': 1 },
          },
        },
      },
    },
  })
  async handleCommunityFetchMoreMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { communityChatId: number; lastMessageId: number },
  ) {
    const userId = parseInt(client.handshake.query.userId as string);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      const messages = await this.chatService.getCommunityChatMessages(payload.communityChatId, userId, { beforeId: payload.lastMessageId });
      client.emit('communityLoadMoreMessages', messages);
      return { message: 'More community messages fetched successfully', data: messages };
    } catch (error) {
      console.error('Error fetching more community messages:', error);
      throw new BadRequestException(error.message || 'Failed to fetch more community messages');
    }
  }

  @SubscribeMessage('markMessageAsRead')
  @ApiOperation({
    summary: 'Mark a message as read in a normal chat (WebSocket)',
    description: 'Marks a message as read and emits a `messageRead` event to both sender and receiver (if connected).',
  })
  @ApiResponse({
    status: 200,
    description: 'Message marked as read, emitted as `messageRead` event',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Message marked as read' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid message ID' })
  @ApiResponse({ status: 404, description: 'Not Found - Message not found' })
  async handleMarkMessageAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: number },
  ) {
    try {
      const message = await this.prismaService.messages.findUnique({
        where: { id: payload.messageId },
        include: { chats: true },
      });

      if (!message) {
        throw new BadRequestException('Message not found');
      }

      const updatedMessage = await this.prismaService.messages.update({
        where: { id: payload.messageId },
        data: { is_read: true },
      });

      const messageData = {
        id: updatedMessage.id,
        chatId: updatedMessage.chat_id,
        senderId: updatedMessage.sender_id,
        messageText: updatedMessage.message_text,
        sentAt: updatedMessage.sent_at.toISOString(),
        isRead: updatedMessage.is_read,
      };

      const senderSocket = this.connectedUsers.get(message.sender_id);
      const receiverSocket = this.connectedUsers.get(
        message.chats.user1_id === message.sender_id
          ? message.chats.user2_id
          : message.chats.user1_id,
      );

      if (senderSocket) {
        senderSocket.emit('messageRead', messageData);
        await this.emitBuyersAndSellersUpdate(message.sender_id, senderSocket);
      }
      if (receiverSocket) {
        receiverSocket.emit('messageRead', messageData);
        await this.emitBuyersAndSellersUpdate(
          message.chats.user1_id === message.sender_id
            ? message.chats.user2_id
            : message.chats.user1_id,
          receiverSocket,
        );
      }

      return { message: 'Message marked as read' };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to mark message as read');
    }
  }

  @SubscribeMessage('toggleMessageReaction')
  @ApiOperation({
    summary: 'Toggle a reaction on a community message (WebSocket)',
    description: 'Toggles a reaction (add or remove) for a community message and emits a `messageReactionUpdated` event to all connected clients with the updated reactions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction toggled successfully, emitted as `messageReactionUpdated` event',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Reaction toggled successfully' },
        data: {
          type: 'object',
          properties: {
            messageId: { type: 'number', example: 1 },
            reactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  emoji_type: { type: 'string', example: '👍' },
                  user_id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'john_doe' },
                  created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:22:00.000Z' },
                },
              },
            },
            reaction_counts: {
              type: 'object',
              additionalProperties: { type: 'number' },
              example: { '👍': 2, '❤️': 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid message ID, user ID, or emoji' })
  @ApiResponse({ status: 404, description: 'Not Found - Message or user not found' })
  async handleToggleMessageReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: number; emoji: string },
  ) {
    const userId = parseInt(client.handshake.query.userId as string);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      const reactionData = await this.chatService.toggleMessageReaction({
        messageId: payload.messageId,
        userId,
        emoji: payload.emoji,
      });

      this.server.emit('messageReactionUpdated', {
        messageId: payload.messageId,
        reactions: reactionData.reactions,
        reaction_counts: reactionData.reaction_counts,
      });

      return {
        message: 'Reaction toggled successfully',
        data: reactionData,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to toggle reaction');
    }
  }

  @SubscribeMessage('deleteMessageReaction')
  @ApiOperation({
    summary: 'Delete a specific reaction on a community message (WebSocket)',
    description: 'Deletes a specific reaction by ID for a community message and emits a `messageReactionUpdated` event to all connected clients with the updated reactions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction deleted successfully, emitted as `messageReactionUpdated` event',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Reaction deleted successfully' },
        data: {
          type: 'object',
          properties: {
            messageId: { type: 'number', example: 1 },
            reactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  emoji_type: { type: 'string', example: '👍' },
                  user_id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'john_doe' },
                  created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:22:00.000Z' },
                },
              },
            },
            reaction_counts: {
              type: 'object',
              additionalProperties: { type: 'number' },
              example: { '👍': 2, '❤️': 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid reaction ID or user ID' })
  @ApiResponse({ status: 404, description: 'Not Found - Reaction not found or not authorized' })
  async handleDeleteMessageReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { reactionId: number },
  ) {
    const userId = parseInt(client.handshake.query.userId as string);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      const reactionData = await this.chatService.deleteMessageReaction({
        reactionId: payload.reactionId,
        userId,
      });

      this.server.emit('messageReactionUpdated', {
        messageId: reactionData.messageId,
        reactions: reactionData.reactions,
        reaction_counts: reactionData.reaction_counts,
      });

      return {
        message: 'Reaction deleted successfully',
        data: reactionData,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete reaction');
    }
  }

  @SubscribeMessage('updateMessageReaction')
  @ApiOperation({
    summary: 'Update a reaction emoji on a community message (WebSocket)',
    description: 'Updates the emoji of a specific reaction by ID for a community message and emits a `messageReactionUpdated` event to all connected clients with the updated reactions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction updated successfully, emitted as `messageReactionUpdated` event',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Reaction updated successfully' },
        data: {
          type: 'object',
          properties: {
            messageId: { type: 'number', example: 1 },
            reactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  emoji_type: { type: 'string', example: '👍' },
                  user_id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'john_doe' },
                  created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:22:00.000Z' },
                },
              },
            },
            reaction_counts: {
              type: 'object',
              additionalProperties: { type: 'number' },
              example: { '👍': 2, '❤️': 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid reaction ID, user ID, or emoji' })
  @ApiResponse({ status: 404, description: 'Not Found - Reaction not found or not authorized' })
  async handleUpdateMessageReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { reactionId: number; newEmoji: string },
  ) {
    const userId = parseInt(client.handshake.query.userId as string);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      const reactionData = await this.chatService.updateMessageReaction({
        reactionId: payload.reactionId,
        userId,
        newEmoji: payload.newEmoji,
      });

      this.server.emit('messageReactionUpdated', {
        messageId: reactionData.messageId,
        reactions: reactionData.reactions,
        reaction_counts: reactionData.reaction_counts,
      });

      return {
        message: 'Reaction updated successfully',
        data: reactionData,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update reaction');
    }
  }

  @SubscribeMessage('deleteCommunityMessage')
  @ApiOperation({
    summary: 'Delete a message in a community chat (WebSocket)',
    description: 'Deletes a message in a community chat by the creator or an admin and emits a `communityMessageDeleted` event to all connected clients.',
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully, emitted as `communityMessageDeleted` event',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Message deleted successfully' },
        data: {
          type: 'object',
          properties: {
            messageId: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid message ID or user not authorized' })
  @ApiResponse({ status: 404, description: 'Not Found - Message not found' })
  async handleDeleteCommunityMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: number },
  ) {
    const userId = parseInt(client.handshake.query.userId as string);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      await this.chatService.deleteCommunityMessage(payload.messageId, userId);
      this.server.emit('communityMessageDeleted', { messageId: payload.messageId });
      return { message: 'Message deleted successfully', data: { messageId: payload.messageId } };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete community message');
    }
  }

  private async emitBuyersAndSellersUpdate(userId: number, client: Socket) {
    try {
      const buyersAndSellers = await this.chatService.getBuyersAndSellers(userId);
      client.emit('buyersAndSellersUpdate', buyersAndSellers.data);
    } catch (error) {
      console.error('Error emitting buyers and sellers update:', error);
    }
  }
}