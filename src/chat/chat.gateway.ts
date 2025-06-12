// import {
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { Injectable, BadRequestException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// @ApiTags('Chats')
// @WebSocketGateway({ cors: { origin: '*' } })
// @Injectable()
// export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;

//   private connectedUsers: Map<number, Socket> = new Map();

//   constructor(private readonly prismaService: PrismaService) {}

//   async handleConnection(client: Socket) {
//     const userId = parseInt(client.handshake.query.userId as string);
//     if (isNaN(userId)) {
//       client.disconnect();
//       throw new BadRequestException('Invalid user ID');
//     }
//     this.connectedUsers.set(userId, client);
//     console.log(`User ${userId} connected`);
//   }

//   handleDisconnect(client: Socket) {
//     const userId = parseInt(client.handshake.query.userId as string);
//     this.connectedUsers.delete(userId);
//     console.log(`User ${userId} disconnected`);
//   }

//   @SubscribeMessage('sendMessage')
//   @ApiOperation({
//     summary: 'Send a message in a chat (WebSocket)',
//     description: 'Sends a message to a chat and emits a `receiveMessage` event to both sender and receiver (if connected). The receiverId must be one of the chat’s users (user1_id or user2_id).',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Message sent successfully, emitted as `receiveMessage` event to sender and receiver',
//     schema: {
//       type: 'object',
//       properties: {
//         message: { type: 'string', description: 'Response message', example: 'Message sent successfully' },
//         data: {
//           type: 'object',
//           properties: {
//             id: { type: 'number', description: 'Message ID', example: 1 },
//             chatId: { type: 'number', description: 'Chat ID', example: 1 },
//             senderId: { type: 'number', description: 'Sender user ID', example: 1 },
//             messageText: { type: 'string', description: 'Message content', example: 'Hello!' },
//             sentAt: { type: 'string', format: 'date-time', description: 'Timestamp when message was sent', example: '2025-05-27T01:38:00.000Z' },
//             isRead: { type: 'boolean', description: 'Whether the message has been read', example: false },
//           },
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid sender ID, chat ID, receiver ID, or message data' })
//   @ApiResponse({ status: 404, description: 'Not Found - Chat or users not found' })
//   @ApiResponse({ status: 500, description: 'Internal Server Error' })
//   async handleSendMessage(client: Socket, payload: { chatId: number; receiverId: number; messageText: string }) {
//     const senderId = parseInt(client.handshake.query.userId as string);
//     if (isNaN(senderId)) {
//       throw new BadRequestException('Invalid sender ID');
//     }

//     try {
//       // Validate chat exists
//       const chat = await this.prismaService.chats.findUnique({
//         where: { id: payload.chatId },
//       });
//       if (!chat) {
//         throw new BadRequestException('Chat not found');
//       }

//       // Create message
//       const message = await this.prismaService.messages.create({
//         data: {
//           chat_id: payload.chatId,
//           sender_id: senderId,
//           message_text: payload.messageText,
//           sent_at: new Date(),
//           is_read: false,
//         },
//         include: { chats: true },
//       });

//       // Emit message to sender and receiver
//       const messageData = {
//         id: message.id,
//         chatId: message.chat_id,
//         senderId: message.sender_id,
//         messageText: message.message_text,
//         sentAt: message.sent_at,
//         isRead: message.is_read,
//       };

//       const senderSocket = this.connectedUsers.get(senderId);
//       const receiverSocket = this.connectedUsers.get(payload.receiverId);

//       if (senderSocket) {
//         senderSocket.emit('receiveMessage', messageData);
//       }
//       if (receiverSocket) {
//         receiverSocket.emit('receiveMessage', messageData);
//       }

//       return { message: 'Message sent successfully', data: messageData };
//     } catch (error) {
//       throw new BadRequestException(error.message || 'Failed to send message');
//     }
//   }

//   @SubscribeMessage('markMessageAsRead')
//   @ApiOperation({
//     summary: 'Mark a message as read in a chat (WebSocket)',
//     description: 'Marks a message as read and emits a `messageRead` event to both sender and receiver (if connected).',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Message marked as read, emitted as `messageRead` event to both users',
//     schema: {
//       type: 'object',
//       properties: {
//         message: { type: 'string', description: 'Response message', example: 'Message marked as read' },
//       },
//     },
//   })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid message ID' })
//   @ApiResponse({ status: 404, description: 'Not Found - Message not found' })
//   @ApiResponse({ status: 500, description: 'Internal Server Error' })
//   async handleMarkMessageAsRead(client: Socket, payload: { messageId: number }) {
//     try {
//       const message = await this.prismaService.messages.findUnique({
//         where: { id: payload.messageId },
//         include: { chats: true },
//       });

//       if (!message) {
//         throw new BadRequestException('Message not found');
//       }

//       // Update read status
//       await this.prismaService.messages.update({
//         where: { id: payload.messageId },
//         data: { is_read: true },
//       });

//       // Notify both users
//       const senderSocket = this.connectedUsers.get(message.sender_id);
//       const receiverSocket = this.connectedUsers.get(
//         message.chats.user1_id === message.sender_id ? message.chats.user2_id : message.chats.user1_id,
//       );

//       const messageData = {
//         id: message.id,
//         chatId: message.chat_id,
//         senderId: message.sender_id,
//         messageText: message.message_text,
//         sentAt: message.sent_at,
//         isRead: true,
//       };

//       if (senderSocket) {
//         senderSocket.emit('messageRead', messageData);
//       }
//       if (receiverSocket) {
//         receiverSocket.emit('messageRead', messageData);
//       }

//       return { message: 'Message marked as read' };
//     } catch (error) {
//       throw new BadRequestException(error.message || 'Failed to mark message as read');
//     }
//   }
// }

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
    description:
      'Sends a message to a normal chat and emits a `receiveMessage` event to both sender and receiver (if connected). The receiverId must be one of the chat’s users (user1_id or user2_id).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Message sent successfully, emitted as `receiveMessage` event to sender and receiver',
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
            sentAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-05-27T01:38:00.000Z',
            },
            isRead: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid sender ID, chat ID, receiver ID, or message data',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Chat or users not found',
  })
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { chatId: number; receiverId: number; messageText: string },
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
        throw new BadRequestException(
          'Sender is not a participant in this chat',
        );
      }
      if (![chat.user1_id, chat.user2_id].includes(payload.receiverId)) {
        throw new BadRequestException(
          'Receiver is not a participant in this chat',
        );
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
        await this.emitBuyersAndSellersUpdate(
          payload.receiverId,
          receiverSocket,
        );
      }

      return { message: 'Message sent successfully', data: messageData };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to send message');
    }
  }

  @SubscribeMessage('communitySendMessage')
  @ApiOperation({
    summary: 'Send a message in a community chat (WebSocket)',
    description:
      'Sends a message to the community chat and broadcasts a `communityReceiveMessage` event to all connected clients.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Community message sent successfully, emitted as `communityReceiveMessage` event',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        content: { type: 'string', example: 'Hello community!' },
        is_admin: { type: 'boolean', example: false },
        sender_id: { type: 'number', example: 1, nullable: true },
        admin_id: { type: 'number', example: null, nullable: true },
        created_at: {
          type: 'string',
          format: 'date-time',
          example: '2025-06-10T12:21:00.000Z',
        },
        users: {
          type: 'object',
          properties: {
            username: { type: 'string', example: 'john_doe' },
            profile_picture: {
              type: 'string',
              example:
                'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed',
              nullable: true,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid sender ID or message data',
  })
  async handleCommunitySendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { content: string; is_admin: boolean },
  ) {
    const senderId = parseInt(client.handshake.query.userId as string);
    if (isNaN(senderId)) {
      throw new BadRequestException('Invalid sender ID');
    }

    try {
      const dataToSend = {
        content: payload.content,
        is_admin: Boolean(payload.is_admin),
        ...(payload.is_admin
          ? { admin_id: senderId }
          : { sender_id: senderId }),
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
        ? await this.chatService.getSignedImageUrl(message.users.profile)
        : null;

      const messageData = {
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
      };

      this.server.emit('communityReceiveMessage', messageData);
      return {
        message: 'Community message sent successfully',
        data: messageData,
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to send community message',
      );
    }
  }

  @SubscribeMessage('communityFetchMessages')
  @ApiOperation({
    summary: 'Fetch latest messages for community chat (WebSocket)',
    description:
      'Fetches the latest 10 messages for the community chat and emits a `communityLoadMessages` event to the client.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Community messages retrieved successfully, emitted as `communityLoadMessages` event',
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
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-06-10T12:21:00.000Z',
          },
          users: {
            type: 'object',
            properties: {
              username: { type: 'string', example: 'john_doe' },
              profile_picture: {
                type: 'string',
                example:
                  'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed',
                nullable: true,
              },
            },
          },
        },
      },
    },
  })
  async handleCommunityFetchMessages(@ConnectedSocket() client: Socket) {
    try {
      const messages = await this.prismaService.community_messages.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          users: {
            select: {
              profile: true,
              username: true,
            },
          },
        },
      });

      const messageData = await Promise.all(
        messages.map(async (msg) => {
          const profilePicture = msg.users?.profile
            ? await this.chatService.getSignedImageUrl(msg.users.profile)
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
        }),
      );

      client.emit('communityLoadMessages', messageData.reverse());
      return {
        message: 'Community messages fetched successfully',
        data: messageData,
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to fetch community messages',
      );
    }
  }

  @SubscribeMessage('communityFetchMoreMessages')
  @ApiOperation({
    summary: 'Fetch older messages for community chat (WebSocket)',
    description:
      'Fetches up to 10 older messages before a specified message ID and emits a `communityLoadMoreMessages` event.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Older community messages retrieved successfully, emitted as `communityLoadMoreMessages` event',
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
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-06-10T12:21:00.000Z',
          },
          users: {
            type: 'object',
            properties: {
              username: { type: 'string', example: 'john_doe' },
              profile_picture: {
                type: 'string',
                example:
                  'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed',
                nullable: true,
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid message ID' })
  async handleCommunityFetchMoreMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { lastMessageId: number },
  ) {
    try {
      const messages = await this.prismaService.community_messages.findMany({
        where: { id: { lt: payload.lastMessageId } },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          users: {
            select: {
              profile: true,
              username: true,
            },
          },
        },
      });

      const messageData = await Promise.all(
        messages.map(async (msg) => {
          const profilePicture = msg.users?.profile
            ? await this.chatService.getSignedImageUrl(msg.users.profile)
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
        }),
      );

      client.emit('communityLoadMoreMessages', messageData.reverse());
      return {
        message: 'More community messages fetched successfully',
        data: messageData,
      };
    } catch (error) {
      console.error('Error fetching more community messages:', error);
      throw new BadRequestException(
        error.message || 'Failed to fetch more community messages',
      );
    }
  }

  @SubscribeMessage('markMessageAsRead')
  @ApiOperation({
    summary: 'Mark a message as read in a normal chat (WebSocket)',
    description:
      'Marks a message as read and emits a `messageRead` event to both sender and receiver (if connected).',
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
      throw new BadRequestException(
        error.message || 'Failed to mark message as read',
      );
    }
  }

  private async emitBuyersAndSellersUpdate(userId: number, client: Socket) {
    try {
      const buyersAndSellers =
        await this.chatService.getBuyersAndSellers(userId);
      client.emit('buyersAndSellersUpdate', buyersAndSellers.data);
    } catch (error) {
      console.error('Error emitting buyers and sellers update:', error);
    }
  }
}
