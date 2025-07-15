// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai';

// @Injectable()
// export class AiChatbotService {
//   private openai: OpenAI;

//   constructor(private configService: ConfigService) {
//     this.openai = new OpenAI({
//       apiKey: this.configService.get<string>('OPENAI_API_KEY'),
//     });
//   }

//   async generateReply(message: string): Promise<string> {
//     const response = await this.openai.chat.completions.create({
//       model: 'gpt-3.5-turbo',
//       messages: [
//         {
//           role: 'system',
//           content:
//             'You are a helpful assistant that answers questions about tech products.',
//         },
//         {
//           role: 'user',
//           content: message,
//         },
//       ],
//     });

//     return response.choices[0].message.content?.trim() || '';
//   }
// }

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiChatbotService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('DEEPSEEK_API_KEY'), // Add this to your .env
      baseURL: 'https://api.deepseek.com/v1', // DeepSeek API base URL
    });
  }

  async generateReply(message: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat', // ✅ DeepSeek-specific model name
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that answers questions about tech products.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    return response.choices[0].message.content?.trim() || '';
  }
}
