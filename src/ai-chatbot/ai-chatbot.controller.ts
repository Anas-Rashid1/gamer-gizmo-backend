// import { Controller, Get, Query } from '@nestjs/common';
// import { AiChatbotService } from './ai-chatbot.service';

// @Controller('ai')
// export class AiChatbotController {
//   constructor(private readonly aiService: AiChatbotService) {}

//   @Get('ask')
//   async askQuestion(@Query('q') question: string) {
//     //@ts-ignore
//     const { reply, productLink } = await this.aiService.generateReply(question);
//     return { reply, productLink };
//   }
// }
import { Controller, Get, Query } from '@nestjs/common';
import { AiChatbotService } from './ai-chatbot.service';

@Controller('ai')
export class AiChatbotController {
  constructor(private readonly aiService: AiChatbotService) {}

  @Get('ask')
  async askQuestion(
    @Query('q') question: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    const skipNum = parseInt(skip, 10) || 0;
    const takeNum = parseInt(take, 10) || 10;
    const { reply, productLink } = await this.aiService.generateReply(
      question,
      skipNum,
      takeNum,
    );
    return { reply, productLink };
  }
}
