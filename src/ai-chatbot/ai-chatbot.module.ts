import { Module } from '@nestjs/common';
import { ProductModule } from '../product/product.module';
import { AiChatbotService } from './ai-chatbot.service';
import { AiChatbotController } from './ai-chatbot.controller';

@Module({
  imports: [ProductModule],
  controllers: [AiChatbotController],
  providers: [AiChatbotService],
})
export class AiChatbotModule {}
