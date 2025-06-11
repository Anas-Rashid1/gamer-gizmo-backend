import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Chats')
@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<number, Socket> = new Map();

  constructor(private readonly prismaService: PrismaService) {}

  async handleConnection(client: Socket) {
    const userId = parseInt(client.handshake.query.userId as string);
    if (isNaN(userId)) {
      client.disconnect();
      throw new BadRequestException('Invalid user ID');
    }
    this.connectedUsers.set(userId, client);
    console.log(`User ${userId} connected`);
  }

  handleDisconnect(client: Socket) {
    const userId = parseInt(client.handshake.query.userId as string);
    this.connectedUsers.delete(userId);
    console.log(`User ${userId} disconnected`);
  }

  @SubscribeMessage('sendMessage')
  @ApiOperation({
    summary: 'Send a message in a chat (WebSocket)',
    description:
      'Sends a message to a chat and emits a `receiveMessage` event to both sender and receiver (if connected). The receiverId must be one of the chat’s users (user1_id or user2_id).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Message sent successfully, emitted as `receiveMessage` event to sender and receiver',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Response message',
          example: 'Message sent successfully',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Message ID', example: 1 },
            chatId: { type: 'number', description: 'Chat ID', example: 1 },
            senderId: {
              type: 'number',
              description: 'Sender user ID',
              example: 1,
            },
            messageText: {
              type: 'string',
              description: 'Message content',
              example: 'Hello!',
            },
            sentAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when message was sent',
              example: '2025-05-27T01:38:00.000Z',
            },
            isRead: {
              type: 'boolean',
              description: 'Whether the message has been read',
              example: false,
            },
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
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async handleSendMessage(
    client: Socket,
    payload: { chatId: number; receiverId: number; messageText: string },
  ) {
    const senderId = parseInt(client.handshake.query.userId as string);
    if (isNaN(senderId)) {
      throw new BadRequestException('Invalid sender ID');
    }

    try {
      // Validate chat exists
      const chat = await this.prismaService.chats.findUnique({
        where: { id: payload.chatId },
      });
      if (!chat) {
        throw new BadRequestException('Chat not found');
      }

      // Create message
      const message = await this.prismaService.messages.create({
        data: {
          chat_id: payload.chatId,
          sender_id: senderId,
          message_text: payload.messageText,
          sent_at: new Date(),
          is_read: false,
        },
        include: { chats: true },
      });

      // Emit message to sender and receiver
      const messageData = {
        id: message.id,
        chatId: message.chat_id,
        senderId: message.sender_id,
        messageText: message.message_text,
        sentAt: message.sent_at,
        isRead: message.is_read,
      };

      const senderSocket = this.connectedUsers.get(senderId);
      const receiverSocket = this.connectedUsers.get(payload.receiverId);

      if (senderSocket) {
        senderSocket.emit('receiveMessage', messageData);
      }
      if (receiverSocket) {
        receiverSocket.emit('receiveMessage', messageData);
      }

      return { message: 'Message sent successfully', data: messageData };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to send message');
    }
  }

  @SubscribeMessage('markMessageAsRead')
  @ApiOperation({
    summary: 'Mark a message as read in a chat (WebSocket)',
    description:
      'Marks a message as read and emits a `messageRead` event to both sender and receiver (if connected).',
  })
  @ApiResponse({
    status: 200,
    description:
      'Message marked as read, emitted as `messageRead` event to both users',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Response message',
          example: 'Message marked as read',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid message ID' })
  @ApiResponse({ status: 404, description: 'Not Found - Message not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async handleMarkMessageAsRead(
    client: Socket,
    payload: { messageId: number },
  ) {
    try {
      const message = await this.prismaService.messages.findUnique({
        where: { id: payload.messageId },
        include: { chats: true },
      });

      if (!message) {
        throw new BadRequestException('Message not found');
      }

      // Update read status
      await this.prismaService.messages.update({
        where: { id: payload.messageId },
        data: { is_read: true },
      });

      // Notify both users
      const senderSocket = this.connectedUsers.get(message.sender_id);
      const receiverSocket = this.connectedUsers.get(
        message.chats.user1_id === message.sender_id
          ? message.chats.user2_id
          : message.chats.user1_id,
      );

      const messageData = {
        id: message.id,
        chatId: message.chat_id,
        senderId: message.sender_id,
        messageText: message.message_text,
        sentAt: message.sent_at,
        isRead: true,
      };

      if (senderSocket) {
        senderSocket.emit('messageRead', messageData);
      }
      if (receiverSocket) {
        receiverSocket.emit('messageRead', messageData);
      }

      return { message: 'Message marked as read' };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to mark message as read',
      );
    }
  }
}
