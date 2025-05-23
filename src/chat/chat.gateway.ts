// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { ChatService } from './chat.service';

// @WebSocketGateway({ cors: '*' })
// export class ChatGateway {
//   @WebSocketServer()
//   server: Server;

//   constructor(private chatService: ChatService) {}

//   @SubscribeMessage('sendMessage')
//   async handleMessage(
//     @MessageBody() data: any,
//     @ConnectedSocket() client: Socket,
//   ) {
//     const message = await this.chatService.createMessage(data);
//     this.server.emit('receiveMessage', message);
//   }

//   @SubscribeMessage('fetchMessages')
//   async fetchMessages(@ConnectedSocket() client: Socket) {
//     const messages = await this.chatService.getMessages({ }); // Fetch latest 20 messages    
//     client.emit('loadMessages', messages);
//   }


//   @SubscribeMessage('fetchMoreMessages')
//   async fetchMoreMessages(
//     @MessageBody() { lastMessageId }: { lastMessageId: number },
//     @ConnectedSocket() client: Socket,
//   ) {
//     console.log("called",lastMessageId)
//     const messages = await this.chatService.getMessages({
//       beforeId: lastMessageId,
//     });
//       client.emit('loadMoreMessages', messages);
//   }
// }
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
  async handleSendMessage(client: Socket, payload: { chatId: number; receiverId: number; messageText: string }) {
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
  async handleMarkMessageAsRead(client: Socket, payload: { messageId: number }) {
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
        message.chats.user1_id === message.sender_id ? message.chats.user2_id : message.chats.user1_id,
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
      throw new BadRequestException(error.message || 'Failed to mark message as read');
    }
  }
}