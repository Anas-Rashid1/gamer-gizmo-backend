import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductService } from '../product/product.service'; // ✅ import
// import Fuse from 'fuse.js';
import OpenAI from 'openai';
const Fuse = require('fuse.js');

@Injectable()
export class AiChatbotService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private productService: ProductService, // ✅ inject here
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateReply(
    message: string,
    skip = 0,
    take = 10,
  ): Promise<{ reply: string; productLink?: string }> {
    const normalizedMessage = message.trim().toLowerCase();

    const categories = await this.productService.getAllCategories();

    const fuse = new Fuse(categories, {
      keys: ['name'],
      threshold: 0.4,
    });

    const matchedCategory = fuse.search(normalizedMessage)?.[0]?.item;

    const aiResponse = await this.openai.chat.completions.create({
      model: 'gpt-4.1', // Use 'gpt-4' or 'gpt-3.5-turbo'
      messages: [
        {
          role: 'system',
          content: `
You are an intelligent assistant for a tech marketplace called GamerGizmo.

Your job is to:
- Help users find products like laptops, PCs, gaming consoles, and accessories.
- Automatically correct any typos in user queries (e.g., "laetop" → "laptop").
- Match keywords to product categories using fuzzy matching.
- Show only 10 product results at a time.
- If more products are available, tell the user to say "show more" to get the next 10.
- Always sort by the newest (descending by created date).
- Include a clickable link for each product like this: https://gamergizmo.com/product-details/{product-id}
- If no product is found, kindly inform the user.
Be friendly, clear, and helpful.
        `.trim(),
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const reply =
      aiResponse.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I couldn’t understand your question.';

    const matchedProducts = await this.productService.findProductByQuery(
      normalizedMessage,
      skip,
      take,
    );

    let productLinks = '';
    if (matchedProducts.length > 0) {
      productLinks = matchedProducts
        .map(
          (product) =>
            `🛒 [${product.name}](https://gamergizmo.com/product-details/${product.id})`,
        )
        .join('\n');
    }

    const showMoreNote =
      matchedProducts.length === take
        ? '\n\nWant to see more? Just say "show more".'
        : '';

    const finalReply =
      (productLinks
        ? `${reply}\n\nHere are some options:\n${productLinks}`
        : `${reply}\n\nSorry, we couldn't find matching products.`) +
      showMoreNote;

    return {
      reply: finalReply,
      productLink: matchedProducts?.[0]?.id
        ? `https://gamergizmo.com/product-details/${matchedProducts[0].id}`
        : undefined,
    };
  }
}

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
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai';
// import { ProductService } from '../product/product.service'; // Inject product service

// @Injectable()
// export class AiChatbotService {
// private openai: OpenAI;
// private frontendUrl: string;

// constructor(
//   private configService: ConfigService,
//   private productService: ProductService,
// ) {
//   this.openai = new OpenAI({
//     apiKey: this.configService.get<string>('DEEPSEEK_API_KEY'),
//     baseURL: 'https://api.deepseek.com/v1',
//   });

//   this.frontendUrl = this.configService.get<string>('FRONTEND_URL')!;
// }

// async generateReply(
//   message: string,
// ): Promise<{ reply: string; productLink?: string }> {
//   const response = await this.openai.chat.completions.create({
//     model: 'deepseek-chat',
//     messages: [
//       {
//         role: 'system',
//         content:
//           'You are a helpful assistant that answers questions about tech products.',
//       },
//       {
//         role: 'user',
//         content: message,
//       },
//     ],
//   });

//   const reply = response.choices[0].message.content?.trim() || '';

//   // 🔍 Try to find product based on message
//   const product = await this.productService.findProductByQuery(message);

//   let productLink: string | undefined;
//   if (product?.id) {
//     productLink = `${this.frontendUrl}/product-details/${product.id}`;
//   }

//   return { reply, productLink };
// }
// }

// last one from the openAI Sample corrected and it's previous correct version is above
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { ProductService } from '../product/product.service';
// import OpenAI from 'openai';
// const Fuse = require('fuse.js');

// @Injectable()
// export class AiChatbotService {
//   private openai: OpenAI;

//   constructor(
//     private configService: ConfigService,
//     private productService: ProductService,
//   ) {
//     this.openai = new OpenAI({
//       apiKey: this.configService.get<string>('OPENAI_API_KEY'),
//     });
//   }

//   async generateReply(
//     message: string,
//     skip = 0,
//     take = 10,
//   ): Promise<{ reply: string; productLink?: string }> {
//     const normalizedMessage = message.trim().toLowerCase();

//     const categories = await this.productService.getAllCategories();

//     const fuse = new Fuse(categories, {
//       keys: ['name'],
//       threshold: 0.4,
//     });

//     const matchedCategory = fuse.search(normalizedMessage)?.[0]?.item;

//     const chatResponse = await this.openai.chat.completions.create({
//       model: 'gpt-4.1', // or 'gpt-4o'
//       messages: [
//         {
//           role: 'system',
//           content: `
// You are an intelligent assistant for a tech marketplace called GamerGizmo.

// Your job is to:
// - Help users find products like laptops, PCs, gaming consoles, and accessories.
// - Automatically correct typos (e.g., "laetop" → "laptop").
// - Match user input to product categories.
// - Show only 10 products at a time.
// - If more exist, suggest saying "show more".
// - Sort by newest (ascending created date).
// - Include a product link like: https://gamergizmo.com/product-details/{product-id}
// - If nothing found, kindly inform the user.
// Be friendly, clear, and helpful.
//         `.trim(),
//         },
//         {
//           role: 'user',
//           content: message,
//         },
//       ],
//     });

//     const reply =
//       chatResponse.choices?.[0]?.message?.content?.trim() ??
//       'Sorry, I couldn’t understand your question.';

//     const matchedProducts = await this.productService.findProductByQuery(
//       normalizedMessage,
//       skip,
//       take,
//     );

//     let productLink: string | undefined;
//     if (matchedProducts.length > 0) {
//       productLink = `https://gamergizmo.com/product-details/${matchedProducts[0].id}`;
//     }

//     return {
//       reply: reply + (productLink ? `\n\nCheck this out: ${productLink}` : ''),
//       productLink,
//     };
//   }
// }
