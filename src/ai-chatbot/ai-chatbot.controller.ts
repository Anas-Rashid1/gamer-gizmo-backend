// import { Body, Controller, Post } from '@nestjs/common';
// import { AiChatbotService } from './ai-chatbot.service';
// import { AskAiDto } from './dto/ask-ai.dto';

// @Controller('ai-chatbot')
// export class AiChatbotController {
//   constructor(private readonly aiChatbotService: AiChatbotService) {}

//   @Post('ask')
//   async askAi(@Body() askAiDto: AskAiDto) {
//     return this.aiChatbotService.askAi(askAiDto.prompt);
//   }
// }
// src/ai/ai.controller.ts
// import { Controller, Get, Query } from '@nestjs/common';
// import { AiChatbotService } from './ai-chatbot.service';

// @Controller('ai')
// export class AiChatbotController {
//   constructor(private readonly aiService: AiChatbotService) {}

//   @Get('ask')
//   async askQuestion(@Query('q') question: string) {
//     const answer = await this.aiService.generateReply(question);
//     return { answer };
//   }
// }
import { Controller, Get, Query } from '@nestjs/common';
import { AiChatbotService } from './ai-chatbot.service';

@Controller('ai')
export class AiChatbotController {
  constructor(private readonly aiService: AiChatbotService) {}

  @Get('ask')
  async askQuestion(@Query('q') question: string) {
    //@ts-ignore
    const { reply, productLink } = await this.aiService.generateReply(question);
    return { reply, productLink };
  }
}
