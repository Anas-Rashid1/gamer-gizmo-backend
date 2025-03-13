import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: '*' })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    const message = await this.chatService.createMessage(data);
    this.server.emit('receiveMessage', message);
  }

  @SubscribeMessage('fetchMessages')
  async fetchMessages(@ConnectedSocket() client: Socket) {
    const messages = await this.chatService.getMessages({ }); // Fetch latest 20 messages    
    client.emit('loadMessages', messages);
  }


  @SubscribeMessage('fetchMoreMessages')
  async fetchMoreMessages(
    @MessageBody() { lastMessageId }: { lastMessageId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log("called",lastMessageId)
    const messages = await this.chatService.getMessages({
      beforeId: lastMessageId,
    });
      client.emit('loadMoreMessages', messages);
  }
}
