import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('Chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('messages')
  async getMessages() {
    return this.chatService.getMessages();
  }
}
