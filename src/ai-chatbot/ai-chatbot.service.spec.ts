import { Test, TestingModule } from '@nestjs/testing';
import { AiChatbotService } from './ai-chatbot.service';

describe('AiChatbotService', () => {
  let service: AiChatbotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiChatbotService],
    }).compile();

    service = module.get<AiChatbotService>(AiChatbotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
