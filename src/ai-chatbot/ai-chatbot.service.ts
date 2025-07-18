import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductService } from '../product/product.service'; // ✅ import
// import Fuse from 'fuse.js';
import OpenAI from 'openai';
import { CategoriesService } from 'src/categories/categories.service';
const Fuse = require('fuse.js');

@Injectable()
export class AiChatbotService {
  private openai: OpenAI;
  private cachedCategories: { id: number; name: string }[] = [];
  private fixedCategories = [
    { id: 1, name: 'Laptops' },
    { id: 2, name: 'Desktops' },
    { id: 3, name: 'Components' },
    { id: 4, name: 'Gaming Consoles' },
  ];
  constructor(
    private configService: ConfigService,
    private productService: ProductService, // ✅ inject here
    private categoriesService: CategoriesService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }
  private async getCategoriesForMatching(): Promise<
    { id: number; name: string }[]
  > {
    if (!this.cachedCategories.length) {
      const response = await this.categoriesService.GetAllCategories();
      this.cachedCategories = response.data; // Assuming response has { data: [...] }
    }
    return this.cachedCategories;
  }
  //   async generateReply(
  //     message: string,
  //     skip = 0,
  //     take = 10,
  //   ): Promise<{ reply: string; productLink?: string }> {
  //     const categories = this.fixedCategories; // Use hardcoded categories
  //     const normalizedMessage = message.trim().toLowerCase();

  //     // 1. Find matching products from DB
  //     const matchedProducts = await this.productService.findProductByQuery(
  //       normalizedMessage,
  //       skip,
  //       take,
  //     );
  //     console.log(matchedProducts, 'matchedProducts');

  //     // 2. Fuzzy matching for system prompt (optional, for AI context)
  //     const Fuse = require('fuse.js');
  //     const fuse = new Fuse(categories, {
  //       keys: ['name'],
  //       threshold: 0.4,
  //     });
  //     const matchedCategory = fuse.search(normalizedMessage)?.[0]?.item;

  //     // 3. Generate AI response
  //     const aiResponse = await this.openai.chat.completions.create({
  //       model: 'gpt-4.1',
  //       messages: [
  //         {
  //           role: 'system',
  //           content: `
  // You are an intelligent assistant for a tech marketplace called GamerGizmo.
  // All prices are in AED (United Arab Emirates Dirhams).

  // Important Rules:
  // - Always mention prices in AED
  // - Example: "This laptop costs 2,499 AED"
  // - DO NOT convert to other currencies unless explicitly asked
  // - ONLY suggest products that exist in our database
  // - For the user query "${normalizedMessage}", we found ${matchedProducts.length} matching products
  // - ${matchedCategory ? `The most relevant category is "${matchedCategory.name}"` : 'No specific category matched'}
  // - Show only ${take} product results at a time
  // - If more products are available, tell the user to say "show more" to get the next ${take}
  // - Always sort by newest first
  // - Include clickable links for products
  // - If no product is found, kindly inform the user

  // Current matching products (id, name, price):
  // ${matchedProducts.map((p) => `- ${p.id}: ${p.name} (${p.price} AED)`).join('\n') || 'None found'}

  // Be friendly, clear, and helpful.
  //           `.trim(),
  //         },
  //         {
  //           role: 'user',
  //           content: message,
  //         },
  //       ],
  //     });

  //     const reply =
  //       aiResponse.choices?.[0]?.message?.content?.trim() ||
  //       "Sorry, I couldn't understand your question.";

  //     // 4. Format product links if we have matches
  //     let productLinks = '';
  //     if (matchedProducts.length > 0) {
  //       productLinks = matchedProducts
  //         .map(
  //           (product) =>
  //             `🛒 ${product.name} - ${product.price} AED [View Product](https://gamergizmo.com/product-details/${product.id})`,
  //         )
  //         .join('\n');
  //     }

  //     const showMoreNote =
  //       matchedProducts.length === take
  //         ? '\n\nWant to see more? Just say "show more".'
  //         : '';

  //     const finalReply =
  //       (productLinks
  //         ? `${reply}\n\nHere are some options:\n${productLinks}`
  //         : `${reply}\n\nSorry, we couldn't find matching products.`) +
  //       showMoreNote;

  //     return {
  //       reply: finalReply,
  //       productLink: matchedProducts?.[0]?.id
  //         ? `https://gamergizmo.com/product-details/${matchedProducts[0].id}`
  //         : undefined,
  //     };
  //   }
  async generateReply(
    message: string,
    skip = 0,
    take = 10,
  ): Promise<{ reply: string; productLink?: string }> {
    const categories = this.fixedCategories;
    const normalizedMessage = message.trim().toLowerCase();

    // 1. Find matching products from DB
    const matchedProducts = await this.productService.findProductByQuery(
      normalizedMessage,
      skip,
      take,
    );
    console.log(matchedProducts, 'matchedProducts');

    // 2. Fuzzy matching for system prompt
    const fuse = new Fuse(categories, {
      keys: ['name'],
      threshold: 0.4,
    });
    const matchedCategory = fuse.search(normalizedMessage)?.[0]?.item;

    // 3. Generate AI response
    const aiResponse = await this.openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `
You are an intelligent assistant for a tech marketplace called GamerGizmo.
All prices are in AED (United Arab Emirates Dirhams).

Important Rules:
- Always mention prices in AED
- Example: "This laptop costs 2,499 AED"
- DO NOT convert to other currencies unless explicitly asked
- ONLY suggest products that exist in our database
- For the user query "${normalizedMessage}", we found ${matchedProducts.length} matching products
- ${matchedCategory ? `The most relevant category is "${matchedCategory.name}"` : 'No specific category matched'}
- Show only ${take} product results at a time
- If more products are available, tell the user to say "show more" to get the next ${take}
- Always sort by newest first
- Include clickable links for products using the format: [Product Name](https://gamergizmo.com/product-details/{id})
- If no product is found, kindly inform the user

Current matching products (id, name, price, link):
${
  matchedProducts
    .map(
      (p) =>
        `- ${p.id}: ${p.name} (${p.price} AED, https://gamergizmo.com/product-details/${p.id})`,
    )
    .join('\n') || 'None found'
}

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
      "Sorry, I couldn't understand your question.";

    // 4. Format product links
    let productLinks = '';
    if (matchedProducts.length > 0) {
      productLinks = matchedProducts
        .map(
          (product) =>
            `🛒 ${product.name} - ${product.price} AED [View Product](https://gamergizmo.com/product-details/${product.id})`,
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
