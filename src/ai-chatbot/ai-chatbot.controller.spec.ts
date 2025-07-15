import { Test, TestingModule } from '@nestjs/testing';
import { AiChatbotController } from './ai-chatbot.controller';
import { AiChatbotService } from './ai-chatbot.service';

describe('AiChatbotController', () => {
  let controller: AiChatbotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiChatbotController],
      providers: [AiChatbotService],
    }).compile();

    controller = module.get<AiChatbotController>(AiChatbotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
