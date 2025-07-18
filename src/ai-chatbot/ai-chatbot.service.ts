// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { ProductService } from '../product/product.service'; // ✅ import
// // import Fuse from 'fuse.js';
// import OpenAI from 'openai';
// import { CategoriesService } from 'src/categories/categories.service';
// const Fuse = require('fuse.js');

// @Injectable()
// export class AiChatbotService {
//   private openai: OpenAI;
//   private cachedCategories: { id: number; name: string }[] = [];
//   private fixedCategories = [
//     { id: 1, name: 'Laptops' },
//     { id: 2, name: 'Desktops' },
//     { id: 3, name: 'Components' },
//     { id: 4, name: 'Gaming Consoles' },
//   ];
//   constructor(
//     private configService: ConfigService,
//     private productService: ProductService, // ✅ inject here
//     private categoriesService: CategoriesService,
//   ) {
//     this.openai = new OpenAI({
//       apiKey: this.configService.get<string>('OPENAI_API_KEY'),
//     });
//   }

//   //   async generateReply(
//   //     message: string,
//   //     skip = 0,
//   //     take = 10,
//   //   ): Promise<{ reply: string; productLink?: string }> {
//   //     const categories = this.fixedCategories;
//   //     const normalizedMessage = message.trim().toLowerCase();

//   //     // 1. Find matching products from DB
//   //     const matchedProducts = await this.productService.findProductByQuery(
//   //       normalizedMessage,
//   //       skip,
//   //       take,
//   //     );
//   //     console.log(matchedProducts, 'matchedProducts');

//   //     // 2. Fuzzy matching for system prompt
//   //     const fuse = new Fuse(categories, {
//   //       keys: ['name'],
//   //       threshold: 0.4,
//   //     });
//   //     const matchedCategory = fuse.search(normalizedMessage)?.[0]?.item;

//   //     // 3. Generate AI response
//   //     const aiResponse = await this.openai.chat.completions.create({
//   //       model: 'gpt-4.1',
//   //       messages: [
//   //         {
//   //           role: 'system',
//   //           content: `
//   // You are an intelligent assistant for a tech marketplace called GamerGizmo.
//   // All prices are in AED (United Arab Emirates Dirhams).

//   // Important Rules:
//   // - Always mention prices in AED
//   // - Example: "This laptop costs 2,499 AED"
//   // - DO NOT convert to other currencies unless explicitly asked
//   // - ONLY suggest products that exist in our database
//   // - For the user query "${normalizedMessage}", we found ${matchedProducts.length} matching products
//   // - ${matchedCategory ? `The most relevant category is "${matchedCategory.name}"` : 'No specific category matched'}
//   // - Show only ${take} product results at a time
//   // - If more products are available, tell the user to say "show more" to get the next ${take}
//   // - Always sort by newest first
//   // - Include clickable links for products using the format: [Product Name](https://gamergizmo.com/product-details/{id})
//   // - If no product is found, kindly inform the user

//   // Current matching products (id, name, price, link):
//   // ${
//   //   matchedProducts
//   //     .map(
//   //       (p) =>
//   //         `- ${p.id}: ${p.name} (${p.price} AED, https://gamergizmo.com/product-details/${p.id})`,
//   //     )
//   //     .join('\n') || 'None found'
//   // }

//   // Be friendly, clear, and helpful.
//   //         `.trim(),
//   //         },
//   //         {
//   //           role: 'user',
//   //           content: message,
//   //         },
//   //       ],
//   //     });

//   //     const reply =
//   //       aiResponse.choices?.[0]?.message?.content?.trim() ||
//   //       "Sorry, I couldn't understand your question.";

//   //     // 4. Format product links
//   //     let productLinks = '';
//   //     if (matchedProducts.length > 0) {
//   //       productLinks = matchedProducts
//   //         .map(
//   //           (product) =>
//   //             `🛒 ${product.name} - ${product.price} AED [View Product](https://gamergizmo.com/product-details/${product.id})`,
//   //         )
//   //         .join('\n');
//   //     }

//   //     const showMoreNote =
//   //       matchedProducts.length === take
//   //         ? '\n\nWant to see more? Just say "show more".'
//   //         : '';

//   //     const finalReply =
//   //       (productLinks
//   //         ? `${reply}\n\nHere are some options:\n${productLinks}`
//   //         : `${reply}\n\nSorry, we couldn't find matching products.`) +
//   //       showMoreNote;

//   //     return {
//   //       reply: finalReply,
//   //       productLink: matchedProducts?.[0]?.id
//   //         ? `https://gamergizmo.com/product-details/${matchedProducts[0].id}`
//   //         : undefined,
//   //     };
//   //   }
//   async generateReply(
//     message: string,
//     skip = 0,
//     take = 10,
//   ): Promise<{ reply: string; productLink?: string }> {
//     const categories = this.fixedCategories;
//     const normalizedMessage = message.trim().toLowerCase();

//     // 1. Find matching products from DB
//     const matchedProducts = await this.productService.findProductByQuery(
//       normalizedMessage,
//       skip,
//       take,
//     );
//     console.log(matchedProducts, 'matchedProducts');

//     // 2. Fuzzy matching for system prompt
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
// - Include clickable links for products using the format: [Product Name](https://gamergizmo.com/product-details/{id})
// - If no product is found, kindly inform the user
// - Support price range queries like "under X", "below X", or "between X and Y" and reflect the range in your response

// Current matching products (id, name, price, link):
// ${
//   matchedProducts
//     .map(
//       (p) =>
//         `- ${p.id}: ${p.name} (${p.price} AED, https://gamergizmo.com/product-details/${p.id})`,
//     )
//     .join('\n') || 'None found'
// }

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
//       aiResponse.choices?.[0]?.message?.content?.trim() ||
//       "Sorry, I couldn't understand your question.";

//     // 4. Format product links
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
// }
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
// import Fuse from 'fuse.js';
const Fuse = require('fuse.js');

import { ProductService } from '../product/product.service';
import { CategoriesService } from '../categories/categories.service';

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
    private productService: ProductService,
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
      this.cachedCategories = response.data;
    }
    return this.cachedCategories;
  }

  async generateReply(
    message: string,
    skip = 0,
    take = 10,
  ): Promise<{ reply: string; productLink?: string }> {
    const categories = this.fixedCategories;
    const normalizedMessage = message.trim().toLowerCase();

    // Extract price range from query for filtering
    let priceFilterMin: number | undefined;
    let priceFilterMax: number | undefined;
    const rangeRegex = /\bbetween\s+(\d+)\s*(?:and|-)\s*(\d+)/;
    const rangeMatch = normalizedMessage.replace(/,/g, '').match(rangeRegex);
    const priceRegex = /(\d+)(?:\s*aed)?/;

    if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
      priceFilterMin = parseInt(rangeMatch[1], 10);
      priceFilterMax = parseInt(rangeMatch[2], 10);
    } else {
      const priceMatch = normalizedMessage.replace(/,/g, '').match(priceRegex);
      if (
        priceMatch &&
        priceMatch[1] &&
        (normalizedMessage.includes('under') ||
          normalizedMessage.includes('below'))
      ) {
        priceFilterMin = parseInt(priceMatch[1], 10);
      }
    }

    // 1. Find matching products from DB
    const matchedProducts = await this.productService.findProductByQuery(
      normalizedMessage,
      skip,
      take,
    );
    console.log(matchedProducts, 'matchedProducts');

    // Filter products to ensure they match the price range
    const filteredProducts = matchedProducts.filter((product) => {
      const price = parseFloat(product.price);
      if (priceFilterMin !== undefined && priceFilterMax !== undefined) {
        return price >= priceFilterMin && price <= priceFilterMax;
      } else if (
        (priceFilterMin !== undefined && normalizedMessage.includes('under')) ||
        normalizedMessage.includes('below')
      ) {
        return price <= priceFilterMin;
      }
      return true; // Include all if no price range specified
    });
    console.log(filteredProducts, 'filteredProducts');

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
- For the user query "${normalizedMessage}", we found ${filteredProducts.length} matching products
- ${matchedCategory ? `The most relevant category is "${matchedCategory.name}"` : 'No specific category matched'}
- Show only ${take} product results at a time
- If more products are available, tell the user to say "show more" to get the next ${take}
- Always sort by newest first
- Include clickable links for products using the format: [Product Name](https://gamergizmo.com/product-details/{id})
- If no product is found, kindly inform the user
- Support price range queries like "under X", "below X", or "between X and Y" and reflect the range in your response

Current matching products (id, name, price, link):
${
  filteredProducts
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
    if (filteredProducts.length > 0) {
      productLinks = filteredProducts
        .map(
          (product) =>
            `🛒 ${product.name} - ${product.price} AED [View Product](https://gamergizmo.com/product-details/${product.id})`,
        )
        .join('\n');
    }

    const showMoreNote =
      filteredProducts.length === take
        ? '\n\nWant to see more? Just say "show more".'
        : '';

    const finalReply =
      (productLinks
        ? `${reply}\n\nHere are some options:\n${productLinks}`
        : `${reply}\n\nSorry, we couldn't find matching products.`) +
      showMoreNote;

    return {
      reply: finalReply,
      productLink: filteredProducts?.[0]?.id
        ? `https://gamergizmo.com/product-details/${filteredProducts[0].id}`
        : undefined,
    };
  }
}
