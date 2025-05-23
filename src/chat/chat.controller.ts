// import { Controller, Get } from '@nestjs/common';
// import { ChatService } from './chat.service';

// @Controller('Chat')
// export class ChatController {
//   constructor(private chatService: ChatService) {}

//   @Get('messages')
//   async getMessages() {
//     return this.chatService.getMessages({ });
//   }
// }
import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';

@ApiTags('Chats')
@Controller('/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/create')
  async createChat(@Body() body: { user1Id: number; user2Id: number }) {
    try {
      return await this.chatService.createChat(body.user1Id, body.user2Id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create chat');
    }
  }

  @Get('/messages')
  @ApiQuery({ name: 'chatId', required: true, type: String })
  async getMessages(@Query('chatId') chatId: string) {
    try {
      const parsedChatId = parseInt(chatId);
      if (isNaN(parsedChatId)) {
        throw new BadRequestException('Invalid chat ID');
      }
      return await this.chatService.getMessages(parsedChatId);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to retrieve messages');
    }
  }
}