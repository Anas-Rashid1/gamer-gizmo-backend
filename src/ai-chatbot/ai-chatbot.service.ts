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
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai';
// // import Fuse from 'fuse.js';
// const Fuse = require('fuse.js');

// import { ProductService } from '../product/product.service';
// import { CategoriesService } from '../categories/categories.service';

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
//     private productService: ProductService,
//     private categoriesService: CategoriesService,
//   ) {
//     this.openai = new OpenAI({
//       apiKey: this.configService.get<string>('OPENAI_API_KEY'),
//     });
//   }

//   private async getCategoriesForMatching(): Promise<
//     { id: number; name: string }[]
//   > {
//     if (!this.cachedCategories.length) {
//       const response = await this.categoriesService.GetAllCategories();
//       this.cachedCategories = response.data;
//     }
//     return this.cachedCategories;
//   }

//   async generateReply(
//     message: string,
//     skip = 0,
//     take = 10,
//   ): Promise<{ reply: string; productLink?: string }> {
//     const categories = this.fixedCategories;
//     const normalizedMessage = message.trim().toLowerCase();

//     // Extract price range from query for filtering
//     let priceFilterMin: number | undefined;
//     let priceFilterMax: number | undefined;
//     const rangeRegex = /\bbetween\s+(\d+)\s*(?:and|-)\s*(\d+)/;
//     const rangeMatch = normalizedMessage.replace(/,/g, '').match(rangeRegex);
//     const priceRegex = /(\d+)(?:\s*aed)?/;

//     if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
//       priceFilterMin = parseInt(rangeMatch[1], 10);
//       priceFilterMax = parseInt(rangeMatch[2], 10);
//     } else {
//       const priceMatch = normalizedMessage.replace(/,/g, '').match(priceRegex);
//       if (
//         priceMatch &&
//         priceMatch[1] &&
//         (normalizedMessage.includes('under') ||
//           normalizedMessage.includes('below'))
//       ) {
//         priceFilterMin = parseInt(priceMatch[1], 10);
//       }
//     }

//     // 1. Find matching products from DB
//     const matchedProducts = await this.productService.findProductByQuery(
//       normalizedMessage,
//       skip,
//       take,
//     );
//     console.log(matchedProducts, 'matchedProducts');

//     // Filter products to ensure they match the price range
//     const filteredProducts = matchedProducts.filter((product) => {
//       const price = parseFloat(product.price);
//       if (priceFilterMin !== undefined && priceFilterMax !== undefined) {
//         return price >= priceFilterMin && price <= priceFilterMax;
//       } else if (
//         (priceFilterMin !== undefined && normalizedMessage.includes('under')) ||
//         normalizedMessage.includes('below')
//       ) {
//         return price <= priceFilterMin;
//       }
//       return true; // Include all if no price range specified
//     });
//     console.log(filteredProducts, 'filteredProducts');

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
// - For the user query "${normalizedMessage}", we found ${filteredProducts.length} matching products
// - ${matchedCategory ? `The most relevant category is "${matchedCategory.name}"` : 'No specific category matched'}
// - Show only ${take} product results at a time
// - If more products are available, tell the user to say "show more" to get the next ${take}
// - Always sort by newest first
// - Include clickable links for products using the format: [Product Name](https://gamergizmo.com/product-details/{id})
// - If no product is found, kindly inform the user
// - Support price range queries like "under X", "below X", or "between X and Y" and reflect the range in your response

// Current matching products (id, name, price, link):
// ${
//   filteredProducts
//     .map(
//       (p) =>
//         `- ${p.id}: ${p.name} (${p.price} AED, https://gamergizmo.com/product-details/${p.id})`,
//     )
//     .join('\n') || 'None found'
// }

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

//     // 4. Format product links
//     let productLinks = '';
//     if (filteredProducts.length > 0) {
//       productLinks = filteredProducts
//         .map(
//           (product) =>
//             `🛒 ${product.name} - ${product.price} AED [View Product](https://gamergizmo.com/product-details/${product.id})`,
//         )
//         .join('\n');
//     }

//     const showMoreNote =
//       filteredProducts.length === take
//         ? '\n\nWant to see more? Just say "show more".'
//         : '';

//     const finalReply =
//       (productLinks
//         ? `${reply}\n\nHere are some options:\n${productLinks}`
//         : `${reply}\n\nSorry, we couldn't find matching products.`) +
//       showMoreNote;

//     return {
//       reply: finalReply,
//       productLink: filteredProducts?.[0]?.id
//         ? `https://gamergizmo.com/product-details/${filteredProducts[0].id}`
//         : undefined,
//     };
//   }
// }

// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai';
// const Fuse = require('fuse.js');
// import { ProductService } from '../product/product.service';
// import { CategoriesService } from '../categories/categories.service';
// import { PrismaService } from '../prisma/prisma.service';
// import { Product } from 'src/types/product';
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
//     private productService: ProductService,
//     private categoriesService: CategoriesService,
//     private prismaService: PrismaService,
//   ) {
//     this.openai = new OpenAI({
//       apiKey: this.configService.get<string>('OPENAI_API_KEY'),
//     });
//   }

//   private async getCategoriesForMatching(): Promise<
//     { id: number; name: string }[]
//   > {
//     if (!this.cachedCategories.length) {
//       const response = await this.categoriesService.GetAllCategories();
//       this.cachedCategories = response.data;
//     }
//     return this.cachedCategories.length
//       ? this.cachedCategories
//       : this.fixedCategories;
//   }

//   //   async generateReply(
//   //     message: string,
//   //     skip = 0,
//   //     take = 10,
//   //     sessionData: {
//   //       budgetMin?: number;
//   //       budgetMax?: number;
//   //       categoryId?: number;
//   //     } = {},
//   //   ): Promise<{ reply: string; productLink?: string; updatedSession?: any }> {
//   //     console.log(
//   //       `[generateReply] Input message: ${message}, skip: ${skip}, take: ${take}, session: ${JSON.stringify(sessionData)}`,
//   //     );

//   //     const normalizedMessage = message.trim().toLowerCase();
//   //     const updatedSession = { ...sessionData };

//   //     // Greeting check
//   //     const greetingRegex =
//   //       /^(hi|hello|hey|greetings|good (morning|afternoon|evening)|salaam|assalam|as-salaam|yo|sup)[!,. ]*$/i;
//   //     if (greetingRegex.test(normalizedMessage)) {
//   //       return {
//   //         reply:
//   //           'Hello there! Welcome to GamerGizmo. How can I assist you today? Please let me know which products or categories you are interested in (e.g., Laptops, Desktops, Components, Gaming Consoles).',
//   //         updatedSession,
//   //       };
//   //     }

//   //     const categories = await this.getCategoriesForMatching();
//   //     const fuse = new Fuse(categories, { keys: ['name'], threshold: 0.3 });

//   //     // Try to detect category only if missing
//   //     if (!updatedSession.categoryId) {
//   //       const matchedCategory = fuse.search(normalizedMessage)?.[0]?.item;
//   //       if (matchedCategory) {
//   //         updatedSession.categoryId = matchedCategory.id;
//   //       }
//   //     }

//   //     // Try to detect budget only if missing
//   //     if (!updatedSession.budgetMin && !updatedSession.budgetMax) {
//   //       const budgetMatch = normalizedMessage.match(
//   //         /(\d{2,5})\s*(?:-|to|and)\s*(\d{2,5})|(\d{2,5})/,
//   //       );
//   //       if (budgetMatch) {
//   //         if (budgetMatch[1] && budgetMatch[2]) {
//   //           updatedSession.budgetMin = parseInt(budgetMatch[1], 10);
//   //           updatedSession.budgetMax = parseInt(budgetMatch[2], 10);
//   //         } else if (budgetMatch[3]) {
//   //           updatedSession.budgetMin = 0;
//   //           updatedSession.budgetMax = parseInt(budgetMatch[3], 10);
//   //         }
//   //       }
//   //     }

//   //     // Ask missing info
//   //     if (!updatedSession.categoryId) {
//   //       return {
//   //         reply:
//   //           "Got it! Could you tell me if you're looking for a Laptop, Desktop, Gaming Console, or Components?",
//   //         updatedSession,
//   //       };
//   //     }
//   //     if (!updatedSession.budgetMin && !updatedSession.budgetMax) {
//   //       return {
//   //         reply: 'Sure! Could you also tell me your budget in AED?',
//   //         updatedSession,
//   //       };
//   //     }
//   //     // ✅ Before fetching products:

//   //     //@ts-ignore
//   //     let products: Product[] = [];

//   //     if (
//   //       //@ts-ignore
//   //       !sessionData.lastQuery || // no previous query
//   //       normalizedMessage.includes('laptop') || // user changes category
//   //       /\d{2,5}/.test(normalizedMessage) // mentions budget
//   //     ) {
//   //       products = await this.productService.findProductByQuery(
//   //         normalizedMessage,
//   //         skip,
//   //         take,
//   //       );
//   //       //@ts-ignore
//   //       updatedSession.lastQuery = normalizedMessage;
//   //       //@ts-ignore
//   //       updatedSession.lastResults = products; // store results
//   //     } else {
//   //       //@ts-ignore
//   //       products = sessionData.lastResults || [];
//   //     }

//   //     const matchedCategory = categories.find(
//   //       (c) => c.id === updatedSession.categoryId,
//   //     );
//   //     // Fetch products with complete info
//   //     // const products = await this.productService.findProductByQuery(
//   //     //   normalizedMessage,
//   //     //   skip,
//   //     //   take,
//   //     // );

//   //     const systemPrompt = `
//   // You are an intelligent assistant for a tech marketplace called GamerGizmo.
//   // All prices are in AED.

//   // The user is looking for products in the category "${matchedCategory?.name}" with budget between ${updatedSession.budgetMin} and ${updatedSession.budgetMax} AED.
//   // We found ${products.length} matching products.

//   // ${products.map((p) => `- ${p.name} (${p.price} AED, https://gamergizmo.com/product-details/${p.id})`).join('\n') || 'No products found.'}
//   //   `.trim();

//   //     try {
//   //       const aiResponse = await this.openai.chat.completions.create({
//   //         model: 'gpt-4.1',
//   //         messages: [
//   //           { role: 'system', content: systemPrompt },
//   //           { role: 'user', content: message },
//   //         ],
//   //       });

//   //       let reply =
//   //         aiResponse.choices?.[0]?.message?.content?.trim() ||
//   //         `Sorry, we couldn't find any products matching "${normalizedMessage}".`;

//   //       let productLinks = '';
//   //       if (products.length > 0) {
//   //         productLinks = products
//   //           .map(
//   //             (p) =>
//   //               `🛒 ${p.name} - ${p.price} AED [View Product](https://gamergizmo.com/product-details/${p.id})`,
//   //           )
//   //           .join('\n');
//   //       }

//   //       const showMoreNote =
//   //         products.length === take
//   //           ? '\n\nWant to see more? Just say "show more".'
//   //           : '';

//   //       const finalReply = productLinks
//   //         ? `${reply}\n\nHere are some options:\n${productLinks}${showMoreNote}`
//   //         : `${reply}${showMoreNote}`;

//   //       return {
//   //         reply: finalReply,
//   //         productLink: products?.[0]?.id
//   //           ? `https://gamergizmo.com/product-details/${products[0].id}`
//   //           : undefined,
//   //         updatedSession,
//   //       };
//   //     } catch (error) {
//   //       console.error(`[generateReply] OpenAI Error: ${error.message}`);
//   //       return {
//   //         reply: 'Sorry, something went wrong. Please try again.',
//   //         updatedSession,
//   //       };
//   //     }
//   //   }
//   async generateReply(
//     message: string,
//     skip = 0,
//     take = 10,
//     sessionData: {
//       budgetMin?: number;
//       budgetMax?: number;
//       categoryId?: number;
//       lastQuery?: string;
//       //@ts-ignore
//       lastResults?: Product[];
//       queryType?: string;
//     } = {},
//   ): Promise<{ reply: string; productLink?: string; updatedSession?: any }> {
//     console.log(
//       `[generateReply] Input message: ${message}, skip: ${skip}, take: ${take}, session: ${JSON.stringify(sessionData)}`,
//     );

//     const normalizedMessage = message.trim().toLowerCase();
//     const updatedSession = { ...sessionData };

//     // Greeting check
//     const greetingRegex =
//       /^(hi|hello|hey|greetings|good (morning|afternoon|evening)|salaam|assalam|as-salaam|yo|sup)[!,. ]*$/i;
//     if (greetingRegex.test(normalizedMessage)) {
//       return {
//         reply:
//           'Hello there! Welcome to GamerGizmo. How can I assist you today? Please let me know which products or categories you are interested in (e.g., Laptops, Desktops, Components, Gaming Consoles).',
//         updatedSession,
//       };
//     }

//     const isBrandQuery =
//       /(brands?|manufacturer|which brands|list brands)/i.test(
//         normalizedMessage,
//       );
//     const categories = await this.getCategoriesForMatching();
//     const fuse = new Fuse(categories, { keys: ['name'], threshold: 0.3 });

//     // Try to detect category only if missing
//     if (!updatedSession.categoryId) {
//       const matchedCategory = fuse.search(normalizedMessage)?.[0]?.item;
//       if (matchedCategory) {
//         updatedSession.categoryId = matchedCategory.id;
//       }
//     }

//     // Try to detect budget only if missing
//     if (!updatedSession.budgetMin && !updatedSession.budgetMax) {
//       const budgetMatch = normalizedMessage.match(
//         /(\d{2,5})\s*(?:-|to|and)\s*(\d{2,5})|(\d{2,5})/,
//       );
//       if (budgetMatch) {
//         if (budgetMatch[1] && budgetMatch[2]) {
//           updatedSession.budgetMin = parseInt(budgetMatch[1], 10);
//           updatedSession.budgetMax = parseInt(budgetMatch[2], 10);
//         } else if (budgetMatch[3]) {
//           updatedSession.budgetMin = 0;
//           updatedSession.budgetMax = parseInt(budgetMatch[3], 10);
//         }
//       }
//     }

//     // Ask missing info
//     if (!updatedSession.categoryId) {
//       return {
//         reply:
//           "Got it! Could you tell me if you're looking for a Laptop, Desktop, Gaming Console, or Components?",
//         updatedSession,
//       };
//     }
//     if (!updatedSession.budgetMin && !updatedSession.budgetMax) {
//       return {
//         reply: 'Sure! Could you also tell me your budget in AED?',
//         updatedSession,
//       };
//     }

//     // Handle brand-specific queries
//     if (isBrandQuery && sessionData.lastResults?.length > 0) {
//       const brands = [
//         ...new Set(
//           sessionData.lastResults
//             .map((p) => {
//               const name = p.name.toLowerCase();
//               if (name.includes('hp')) return 'HP';
//               if (name.includes('acer')) return 'Acer';
//               if (name.includes('dell')) return 'Dell';
//               if (name.includes('asus')) return 'ASUS';
//               if (name.includes('msi')) return 'MSI';
//               return null;
//             })
//             .filter(Boolean),
//         ),
//       ];

//       if (normalizedMessage.includes('from gamergizmo')) {
//         return {
//           reply: `Yes, all the brands listed (e.g., ${brands.join(', ')}) are available on GamerGizmo based on the laptops found within your budget (${updatedSession.budgetMin}–${updatedSession.budgetMax} AED). Would you like to see specific models from these brands?`,
//           updatedSession,
//         };
//       }

//       return {
//         reply: `The brands available on GamerGizmo within your budget (${updatedSession.budgetMin}–${updatedSession.budgetMax} AED) for ${categories.find((c) => c.id === updatedSession.categoryId)?.name} are: ${brands.join(', ')}. Would you like more details about specific models from these brands?`,
//         updatedSession,
//       };
//     }

//     // Fetch products
//     let products: Product[] = [];
//     if (
//       !sessionData.lastQuery ||
//       normalizedMessage.includes('laptop') ||
//       /\d{2,5}/.test(normalizedMessage)
//     ) {
//       products = await this.productService.findProductByQuery(
//         normalizedMessage.includes('laptop') ? 'laptop' : normalizedMessage,
//         skip,
//         take,
//       );
//       updatedSession.lastQuery = normalizedMessage;
//       updatedSession.lastResults = products;
//     } else {
//       products = sessionData.lastResults || [];
//     }

//     const matchedCategory = categories.find(
//       (c) => c.id === updatedSession.categoryId,
//     );

//     const systemPrompt = `
// You are an intelligent assistant for a tech marketplace called GamerGizmo.
// All prices are in AED.
// The user is looking for products in the category "${matchedCategory?.name}" with budget between ${updatedSession.budgetMin} and ${updatedSession.budgetMax} AED.
// We found ${products.length} matching products.
// ${products.map((p) => `- ${p.name} (${p.price} AED, https://gamergizmo.com/product-details/${p.id})`).join('\n') || 'No products found.'}
// `.trim();

//     try {
//       const aiResponse = await this.openai.chat.completions.create({
//         model: 'gpt-4.1',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: message },
//         ],
//       });

//       let reply =
//         aiResponse.choices?.[0]?.message?.content?.trim() ||
//         `Sorry, we couldn't find any products matching "${normalizedMessage}".`;

//       let productLinks = '';
//       if (products.length > 0) {
//         productLinks = products
//           .map(
//             (p) =>
//               `🛒 ${p.name} - ${p.price} AED [View Product](https://gamergizmo.com/product-details/${p.id})`,
//           )
//           .join('\n');
//       }

//       const showMoreNote =
//         products.length === take
//           ? '\n\nWant to see more? Just say "show more".'
//           : '';

//       const finalReply = productLinks
//         ? `${reply}\n\nHere are some options:\n${productLinks}${showMoreNote}`
//         : `${reply}${showMoreNote}`;

//       return {
//         reply: finalReply,
//         productLink: products?.[0]?.id
//           ? `https://gamergizmo.com/product-details/${products[0].id}`
//           : undefined,
//         updatedSession,
//       };
//     } catch (error) {
//       console.error(`[generateReply] OpenAI Error: ${error.message}`);
//       return {
//         reply: 'Sorry, something went wrong. Please try again.',
//         updatedSession,
//       };
//     }
//   }
// }
// src/ai-chatbot/ai-chatbot.service.ts
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai';
// import Fuse from 'fuse.js';
// import { ProductService } from '../product/product.service';
// import { CategoriesService } from '../categories/categories.service';
// import { PrismaService } from '../prisma/prisma.service';
// import { Product } from '../types/product';

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
//     private productService: ProductService,
//     private categoriesService: CategoriesService,
//     private prismaService: PrismaService,
//   ) {
//     this.openai = new OpenAI({
//       apiKey: this.configService.get<string>('OPENAI_API_KEY'),
//     });
//   }

//   private async getCategoriesForMatching(): Promise<
//     { id: number; name: string }[]
//   > {
//     if (!this.cachedCategories.length) {
//       const response = await this.categoriesService.GetAllCategories();
//       this.cachedCategories = response.data;
//     }
//     return this.cachedCategories.length
//       ? this.cachedCategories
//       : this.fixedCategories;
//   }

//   private detectCategory(query: string): number | undefined {
//     const normalizedQuery = query.trim().toLowerCase();
//     if (
//       normalizedQuery.includes('laptop') ||
//       normalizedQuery.includes('laptops')
//     ) {
//       return 1; // Laptops
//     } else if (
//       normalizedQuery.includes('desktop') ||
//       normalizedQuery.includes('desktops') ||
//       normalizedQuery.includes('pc') ||
//       normalizedQuery.includes('computer') ||
//       normalizedQuery.includes('gaming pc')
//     ) {
//       return 2; // Desktops
//     } else if (
//       normalizedQuery.includes('component') ||
//       normalizedQuery.includes('components')
//     ) {
//       return 3; // Components
//     } else if (
//       normalizedQuery.includes('console') ||
//       normalizedQuery.includes('consoles') ||
//       normalizedQuery.includes('gaming console')
//     ) {
//       return 4; // Gaming Consoles
//     }
//     return undefined;
//   }

//   async generateReply(
//     message: string,
//     skip = 0,
//     take = 10,
//     sessionData: {
//       budgetMin?: number;
//       budgetMax?: number;
//       categoryId?: number;
//       lastQuery?: string;
//       lastResults?: Product[];
//       queryType?: string;
//     } = {},
//   ): Promise<{ reply: string; productLink?: string; updatedSession?: any }> {
//     console.log(
//       `[generateReply] Input message: ${message}, skip: ${skip}, take: ${take}, session: ${JSON.stringify(sessionData)}`,
//     );

//     const normalizedMessage = message.trim().toLowerCase();
//     const updatedSession = { ...sessionData };

//     // Greeting check
//     const greetingRegex =
//       /^(hi|hello|hey|greetings|good (morning|afternoon|evening)|salaam|assalam|as-salaam|yo|sup)[!,. ]*$/i;
//     if (greetingRegex.test(normalizedMessage)) {
//       return {
//         reply:
//           'Hello there! Welcome to GamerGizmo. How can I assist you today? Please let me know which products or categories you are interested in (e.g., Laptops, Desktops, Components, Gaming Consoles).',
//         updatedSession,
//       };
//     }

//     const isBrandQuery =
//       /(brands?|manufacturer|which brands|list brands)/i.test(
//         normalizedMessage,
//       );
//     const categories = await this.getCategoriesForMatching();
//     const fuse = new Fuse(categories, { keys: ['name'], threshold: 0.3 });

//     // Try to detect category only if missing
//     if (!updatedSession.categoryId) {
//       updatedSession.categoryId = this.detectCategory(normalizedMessage);
//       if (!updatedSession.categoryId) {
//         const matchedCategory = fuse.search(normalizedMessage)?.[0]?.item;
//         if (matchedCategory) {
//           updatedSession.categoryId = matchedCategory.id;
//         }
//       }
//     }

//     // Try to detect budget only if missing
//     if (!updatedSession.budgetMin && !updatedSession.budgetMax) {
//       const budgetMatch = normalizedMessage.match(
//         /(\d{2,5})\s*(?:-|to|and)\s*(\d{2,5})|(\d{2,5})/,
//       );
//       if (budgetMatch) {
//         if (budgetMatch[1] && budgetMatch[2]) {
//           updatedSession.budgetMin = parseInt(budgetMatch[1], 10);
//           updatedSession.budgetMax = parseInt(budgetMatch[2], 10);
//         } else if (budgetMatch[3]) {
//           updatedSession.budgetMin = 0;
//           updatedSession.budgetMax = parseInt(budgetMatch[3], 10);
//         }
//       }
//     }

//     // Ask missing info
//     if (!updatedSession.categoryId) {
//       return {
//         reply:
//           "Got it! Could you tell me if you're looking for a Laptop, Desktop, Gaming Console, or Components?",
//         updatedSession,
//       };
//     }
//     if (!updatedSession.budgetMin && !updatedSession.budgetMax) {
//       return {
//         reply: 'Sure! Could you also tell me your budget in AED?',
//         updatedSession,
//       };
//     }

//     // Handle brand-specific queries
//     if (isBrandQuery && sessionData.lastResults?.length > 0) {
//       const brands = [
//         ...new Set(
//           sessionData.lastResults
//             .map((p) => {
//               const name = p.name.toLowerCase();
//               if (name.includes('hp')) return 'HP';
//               if (name.includes('acer')) return 'Acer';
//               if (name.includes('dell')) return 'Dell';
//               if (name.includes('asus')) return 'ASUS';
//               if (name.includes('msi')) return 'MSI';
//               return null;
//             })
//             .filter(Boolean),
//         ),
//       ];

//       if (normalizedMessage.includes('from gamergizmo')) {
//         return {
//           reply: `Yes, all the brands listed (e.g., ${brands.join(', ')}) are available on GamerGizmo based on the products found within your budget (${updatedSession.budgetMin}–${updatedSession.budgetMax} AED). Would you like to see specific models from these brands?`,
//           updatedSession,
//         };
//       }

//       return {
//         reply: `The brands available on GamerGizmo within your budget (${updatedSession.budgetMin}–${updatedSession.budgetMax} AED) for ${categories.find((c) => c.id === updatedSession.categoryId)?.name} are: ${brands.join(', ')}. Would you like more details about specific models from these brands?`,
//         updatedSession,
//       };
//     }

//     // Fetch products
//     let products: Product[] = [];
//     if (
//       !sessionData.lastQuery ||
//       normalizedMessage.match(/(laptop|desktop|pc|console|component)/i) ||
//       /\d{2,5}/.test(normalizedMessage)
//     ) {
//       const queryForSearch = normalizedMessage.match(
//         /(laptop|desktop|pc|console|component)/i,
//       )
//         ? normalizedMessage.match(/(laptop|desktop|pc|console|component)/i)[0]
//         : normalizedMessage;
//       products = await this.productService.findProductByQuery(
//         queryForSearch,
//         skip,
//         take,
//       );
//       updatedSession.lastQuery = normalizedMessage;
//       updatedSession.lastResults = products;
//       updatedSession.queryType = isBrandQuery ? 'brand' : 'product';
//     } else {
//       products = sessionData.lastResults || [];
//     }

//     const matchedCategory = categories.find(
//       (c) => c.id === updatedSession.categoryId,
//     );

//     // Filter products by budget
//     products = products.filter(
//       (p) =>
//         parseFloat(p.price) >= (updatedSession.budgetMin || 0) &&
//         parseFloat(p.price) <= (updatedSession.budgetMax || Infinity),
//     );

//     const systemPrompt = `
// You are an intelligent assistant for a tech marketplace called GamerGizmo.
// All prices are in AED.
// The user is looking for products in the category "${matchedCategory?.name}" with budget between ${updatedSession.budgetMin} and ${updatedSession.budgetMax} AED.
// We found ${products.length} matching products.
// ${products.map((p) => `- ${p.name} (${p.price} AED, https://gamergizmo.com/product-details/${p.id})`).join('\n') || 'No products found.'}
// `.trim();

//     try {
//       const aiResponse = await this.openai.chat.completions.create({
//         model: 'gpt-4.1',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: message },
//         ],
//       });

//       let reply =
//         aiResponse.choices?.[0]?.message?.content?.trim() ||
//         `Sorry, we couldn't find any products matching "${normalizedMessage}".`;

//       // Streamline response to avoid repetition
//       if (products.length > 0) {
//         const productLinks = products
//           .map(
//             (p) =>
//               `🛒 ${p.name} - ${p.price} AED [View Product](https://gamergizmo.com/product-details/${p.id})`,
//           )
//           .join('\n');
//         reply = `Here are ${products.length} products within your budget of ${updatedSession.budgetMin}–${updatedSession.budgetMax} AED in the ${matchedCategory?.name} category:\n${productLinks}`;
//       }

//       const showMoreNote =
//         products.length === take
//           ? '\n\nWant to see more? Just say "show more".'
//           : '';

//       return {
//         reply: `${reply}${showMoreNote}`,
//         productLink: products?.[0]?.id
//           ? `https://gamergizmo.com/product-details/${products[0].id}`
//           : undefined,
//         updatedSession,
//       };
//     } catch (error) {
//       console.error(`[generateReply] OpenAI Error: ${error.message}`);
//       return {
//         reply: 'Sorry, something went wrong. Please try again.',
//         updatedSession,
//       };
//     }
//   }
// }

// src/ai-chatbot/ai-chatbot.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
const Fuse = require('fuse.js');
import { ProductService } from '../product/product.service';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '../types/product';

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
    private prismaService: PrismaService,
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
    return this.cachedCategories.length
      ? this.cachedCategories
      : this.fixedCategories;
  }

  private detectCategory(query: string): number | undefined {
    const normalizedQuery = query.trim().toLowerCase();
    if (
      normalizedQuery.includes('laptop') ||
      normalizedQuery.includes('laptops')
    ) {
      return 1; // Laptops
    } else if (
      normalizedQuery.includes('desktop') ||
      normalizedQuery.includes('desktops') ||
      normalizedQuery.includes('pc') ||
      normalizedQuery.includes('computer') ||
      normalizedQuery.includes('gaming pc')
    ) {
      return 2; // Desktops
    } else if (
      normalizedQuery.includes('component') ||
      normalizedQuery.includes('components')
    ) {
      return 3; // Components
    } else if (
      normalizedQuery.includes('console') ||
      normalizedQuery.includes('consoles') ||
      normalizedQuery.includes('gaming console')
    ) {
      return 4; // Gaming Consoles
    }
    return undefined;
  }

  async generateReply(
    message: string,
    skip = 0,
    take = 10,
    sessionData: {
      budgetMin?: number;
      budgetMax?: number;
      categoryId?: number;
      lastQuery?: string;
      lastResults?: Product[];
      queryType?: string;
      skip?: number; // ✅ Added
      take?: number; // ✅ Added
    } = {},
  ): Promise<{ reply: string; productLink?: string; updatedSession?: any }> {
    console.log(
      `[generateReply] Input message: ${message}, skip: ${skip}, take: ${take}, session: ${JSON.stringify(sessionData)}`,
    );

    const normalizedMessage = message.trim().toLowerCase();
    const updatedSession = { ...sessionData };

    // ✅ Detect "show more"
    const isShowMore = normalizedMessage.includes('show more');
    if (isShowMore) {
      updatedSession.skip =
        (updatedSession.skip || 0) + (updatedSession.take || 10);
    } else {
      updatedSession.skip = 0; // reset for a new search
    }
    updatedSession.take = updatedSession.take || 10;

    // Greeting check
    const greetingRegex =
      /^(hi|hello|hey|greetings|good (morning|afternoon|evening)|salaam|assalam|as-salaam|yo|sup)[!,. ]*$/i;
    if (greetingRegex.test(normalizedMessage)) {
      return {
        reply:
          'Hello there! Welcome to GamerGizmo. How can I assist you today? Please let me know which products or categories you are interested in (e.g., Laptops, Desktops, Components, Gaming Consoles).',
        updatedSession,
      };
    }

    const isBrandQuery =
      /(brands?|manufacturer|which brands|list brands)/i.test(
        normalizedMessage,
      );
    const categories = await this.getCategoriesForMatching();

    const fuse = new Fuse(categories, {
      keys: ['name'],
      threshold: 0.3,
    });

    // Try to detect category only if missing
    if (!updatedSession.categoryId && !isShowMore) {
      updatedSession.categoryId = this.detectCategory(normalizedMessage);
      if (!updatedSession.categoryId) {
        const matchedCategory = fuse.search(normalizedMessage)?.[0]?.item;
        if (matchedCategory) {
          updatedSession.categoryId = matchedCategory.id;
        }
      }
    }

    // Try to detect budget only if missing
    if (!updatedSession.budgetMin && !updatedSession.budgetMax && !isShowMore) {
      const budgetMatch = normalizedMessage.match(
        /(\d{2,5})\s*(?:-|to|and)\s*(\d{2,5})|(\d{2,5})/,
      );
      if (budgetMatch) {
        if (budgetMatch[1] && budgetMatch[2]) {
          updatedSession.budgetMin = parseInt(budgetMatch[1], 10);
          updatedSession.budgetMax = parseInt(budgetMatch[2], 10);
        } else if (budgetMatch[3]) {
          updatedSession.budgetMin = 0;
          updatedSession.budgetMax = parseInt(budgetMatch[3], 10);
        }
      }
    }

    // Ask missing info
    if (!updatedSession.categoryId) {
      return {
        reply:
          "Got it! Could you tell me if you're looking for a Laptop, Desktop, Gaming Console, or Components?",
        updatedSession,
      };
    }
    if (!updatedSession.budgetMin && !updatedSession.budgetMax) {
      return {
        reply: 'Sure! Could you also tell me your budget in AED?',
        updatedSession,
      };
    }

    // Handle brand-specific queries
    if (isBrandQuery && sessionData.lastResults?.length > 0) {
      const brands = [
        ...new Set(
          sessionData.lastResults
            .map((p) => {
              const name = p.name.toLowerCase();
              if (name.includes('hp')) return 'HP';
              if (name.includes('acer')) return 'Acer';
              if (name.includes('dell')) return 'Dell';
              if (name.includes('asus')) return 'ASUS';
              if (name.includes('msi')) return 'MSI';
              return null;
            })
            .filter(Boolean),
        ),
      ];

      if (normalizedMessage.includes('from gamergizmo')) {
        return {
          reply: `Yes, all the brands listed (e.g., ${brands.join(', ')}) are available on GamerGizmo based on the products found within your budget (${updatedSession.budgetMin}–${updatedSession.budgetMax} AED). Would you like to see specific models from these brands?`,
          updatedSession,
        };
      }

      return {
        reply: `The brands available on GamerGizmo within your budget (${updatedSession.budgetMin}–${updatedSession.budgetMax} AED) for ${categories.find((c) => c.id === updatedSession.categoryId)?.name} are: ${brands.join(', ')}. Would you like more details about specific models from these brands?`,
        updatedSession,
      };
    }

    // ✅ Always refetch products when showing more
    const queryForSearch = normalizedMessage.match(
      /(laptop|desktop|pc|console|component)/i,
    )
      ? normalizedMessage.match(/(laptop|desktop|pc|console|component)/i)[0]
      : sessionData.lastQuery || normalizedMessage;

    let products: Product[] = await this.productService.findProductByQuery(
      queryForSearch,
      updatedSession.skip,
      updatedSession.take,
    );

    updatedSession.lastQuery = queryForSearch;
    updatedSession.lastResults = [
      ...(sessionData.lastResults || []),
      ...products,
    ]; // accumulate results
    updatedSession.queryType = isBrandQuery ? 'brand' : 'product';

    const matchedCategory = categories.find(
      (c) => c.id === updatedSession.categoryId,
    );

    // Filter products by budget
    products = products.filter(
      (p) =>
        parseFloat(p.price) >= (updatedSession.budgetMin || 0) &&
        parseFloat(p.price) <= (updatedSession.budgetMax || Infinity),
    );

    let reply: string;
    if (products.length > 0) {
      const productLinks = products
        .map(
          (p) =>
            `🛒 ${p.name} - ${p.price} AED <a href="https://gamergizmo.com/product-details/${p.id}" target="_blank" style="color: #4da6ff; text-decoration: underline;">View Product</a>`,
        )
        .join('<br>');

      reply = `Here are ${products.length} products within your budget of ${updatedSession.budgetMin}–${updatedSession.budgetMax} AED in the ${matchedCategory?.name} category:\n${productLinks}`;
    } else {
      reply = `Sorry, we couldn't find any products matching "${normalizedMessage}".`;
    }

    const showMoreNote =
      products.length === updatedSession.take
        ? '\n\nWant to see more? Just say "show more".'
        : '';

    return {
      reply: `${reply}${showMoreNote}`,
      productLink: products?.[0]?.id
        ? `https://gamergizmo.com/product-details/${products[0].id}`
        : undefined,
      updatedSession,
    };
  }
}
