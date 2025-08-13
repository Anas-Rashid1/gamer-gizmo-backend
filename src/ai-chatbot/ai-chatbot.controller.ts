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
import { SessionStoreService } from 'src/session-store/session-store.service';

@Controller('ai')
export class AiChatbotController {
  constructor(
    private readonly aiService: AiChatbotService,
    private readonly sessionStore: SessionStoreService,
  ) {}

  @Get('ask')
  async askQuestion(
    @Query('q') question: string,
    @Query('sessionId') sessionId: string, // required to track state
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    if (!sessionId) {
      throw new Error('sessionId is required for conversation tracking');
    }

    const skipNum = parseInt(skip, 10) || 0;
    const takeNum = parseInt(take, 10) || 10;

    // Retrieve stored session info
    const sessionData = this.sessionStore.getSession(sessionId);
    const { reply, productLink, updatedSession } =
      await this.aiService.generateReply(
        question,
        skipNum,
        takeNum,
        sessionData,
      );

    // Save updated session
    this.sessionStore.updateSession(sessionId, updatedSession);
    return { reply, productLink };
  }
}
