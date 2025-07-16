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

// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai';

// @Injectable()
// export class AiChatbotService {
//   private openai: OpenAI;

//   constructor(private configService: ConfigService) {
//     this.openai = new OpenAI({
//       apiKey: this.configService.get<string>('DEEPSEEK_API_KEY'), // Add this to your .env
//       baseURL: 'https://api.deepseek.com/v1', // DeepSeek API base URL
//     });
//   }

//   async generateReply(message: string): Promise<string> {
//     const response = await this.openai.chat.completions.create({
//       model: 'deepseek-chat',
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

// new code with product link
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ProductService } from '../product/product.service'; // Inject product service

@Injectable()
export class AiChatbotService {
  private openai: OpenAI;
  private frontendUrl: string;

  constructor(
    private configService: ConfigService,
    private productService: ProductService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('DEEPSEEK_API_KEY'),
      baseURL: 'https://api.deepseek.com/v1',
    });

    this.frontendUrl = this.configService.get<string>('FRONTEND_URL')!;
  }

  async generateReply(
    message: string,
  ): Promise<{ reply: string; productLink?: string }> {
    const response = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
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

    const reply = response.choices[0].message.content?.trim() || '';

    // 🔍 Try to find product based on message
    const product = await this.productService.findProductByQuery(message);

    let productLink: string | undefined;
    if (product?.id) {
      productLink = `${this.frontendUrl}/product-details/${product.id}`;
    }

    return { reply, productLink };
  }
}
