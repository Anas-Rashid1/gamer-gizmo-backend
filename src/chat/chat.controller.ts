
// import { Controller, Get, Post, Body, Query, BadRequestException, UseGuards, Req } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
// import { ChatService } from './chat.service';
// import { AuthGuard } from '../auth/auth.gurad';
// import { Request } from 'express';

// interface JwtPayload {
//   id: number;
//   [key: string]: any;
// }

// @ApiTags('Chats')
// @ApiBearerAuth()
// @Controller('/chats')
// @UseGuards(AuthGuard)
// export class ChatController {
//   constructor(private readonly chatService: ChatService) {}

//   @Post('/create')
//   @ApiOperation({ summary: 'Create a new normal chat between two users' })
//   @ApiBody({
//     description: 'User IDs for the chat participants (must exist in users table)',
//     schema: {
//       type: 'object',
//       required: ['user1Id', 'user2Id'],
//       properties: {
//         user1Id: { type: 'number', description: 'ID of the first user', example: 1 },
//         user2Id: { type: 'number', description: 'ID of the second user', example: 2 },
//       },
//     },
//   })
//   @ApiResponse({
//     status: 201,
//     description: 'Chat created successfully or already exists',
//     schema: {
//       type: 'object',
//       properties: {
//         message: { type: 'string', example: 'Chat created successfully' },
//         data: {
//           type: 'object',
//           properties: {
//             id: { type: 'number', example: 1 },
//             user1_id: { type: 'number', example: 1 },
//             user2_id: { type: 'number', example: 2 },
//             created_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
//             updated_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
//           },
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid user IDs, same user ID, or users not found' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   async createChat(@Body() body: { user1Id: number; user2Id: number }) {
//     try {
//       return await this.chatService.createChat(body.user1Id, body.user2Id);
//     } catch (error) {
//       throw new BadRequestException(error.message || 'Failed to create chat');
//     }
//   }

//   @Get('/messages')
//   @ApiOperation({ summary: 'Retrieve all messages for a specific normal chat' })
//   @ApiQuery({
//     name: 'chatId',
//     required: true,
//     type: String,
//     description: 'ID of the chat to retrieve messages for (must exist in chats table)',
//     example: '1',
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Messages retrieved successfully',
//     schema: {
//       type: 'object',
//       properties: {
//         message: { type: 'string', example: 'Messages retrieved successfully' },
//         data: {
//           type: 'array',
//           items: {
//             type: 'object',
//             properties: {
//               id: { type: 'number', example: 1 },
//               chat_id: { type: 'number', example: 1 },
//               sender_id: { type: 'number', example: 1 },
//               message_text: { type: 'string', example: 'Hello!' },
//               sent_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
//               is_read: { type: 'boolean', example: false },
//             },
//           },
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid or non-existent chat ID' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   async getMessages(@Query('chatId') chatId: string) {
//     try {
//       const parsedChatId = parseInt(chatId);
//       if (isNaN(parsedChatId)) {
//         throw new BadRequestException('Invalid chat ID');
//       }
//       return await this.chatService.getMessages(parsedChatId);
//     } catch (error) {
//       throw new BadRequestException(error.message || 'Failed to retrieve messages');
//     }
//   }

//   @Get('/buyers-and-sellers')
//   @ApiOperation({ summary: 'Retrieve buyers and sellers for the authenticated user' })
//   @ApiResponse({
//     status: 200,
//     description: 'Buyers and sellers retrieved successfully',
//     schema: {
//       type: 'object',
//       properties: {
//         message: { type: 'string', example: 'Buyers and sellers retrieved successfully' },
//         data: {
//           type: 'object',
//           properties: {
//             buyers: {
//               type: 'array',
//               items: {
//                 type: 'object',
//                 properties: {
//                   id: { type: 'number', example: 1 },
//                   username: { type: 'string', example: 'john_doe' },
//                   first_name: { type: 'string', example: 'John', nullable: true },
//                   last_name: { type: 'string', example: 'Doe', nullable: true },
//                   is_seller: { type: 'boolean', example: false },
//                   profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
//                   last_message: {
//                     type: 'object',
//                     properties: {
//                       message_text: { type: 'string', example: 'Hello!' },
//                       sent_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
//                       is_read: { type: 'boolean', example: false },
//                     },
//                     nullable: true,
//                   },
//                   chat_id: { type: 'number', example: 1 },
//                   unread_count: { type: 'number', example: 2 },
//                 },
//               },
//             },
//             sellers: {
//               type: 'array',
//               items: {
//                 type: 'object',
//                 properties: {
//                   id: { type: 'number', example: 2 },
//                   username: { type: 'string', example: 'jane_seller' },
//                   first_name: { type: 'string', example: 'Jane', nullable: true },
//                   last_name: { type: 'string', example: 'Seller', nullable: true },
//                   is_seller: { type: 'boolean', example: true },
//                   profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
//                   last_message: {
//                     type: 'object',
//                     properties: {
//                       message_text: { type: 'string', example: 'Hello!' },
//                       sent_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
//                       is_read: { type: 'boolean', example: false },
//                     },
//                     nullable: true,
//                   },
//                   chat_id: { type: 'number', example: 2 },
//                   unread_count: { type: 'number', example: 1 },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid user ID or failed to retrieve data' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   async getBuyersAndSellers(@Req() request: Request & { user: JwtPayload }) {
//     try {
//       return await this.chatService.getBuyersAndSellers(request.user.id);
//     } catch (error) {
//       throw new BadRequestException(error.message || 'Failed to retrieve buyers and sellers');
//     }
//   }

//   @Get('/community/messages')
//   @ApiOperation({ summary: 'Retrieve all messages for the community chat' })
//   @ApiResponse({
//     status: 200,
//     description: 'Community messages retrieved successfully',
//     schema: {
//       type: 'array',
//       items: {
//         type: 'object',
//         properties: {
//           id: { type: 'number', example: 1 },
//           content: { type: 'string', example: 'Hello community!' },
//           is_admin: { type: 'boolean', example: false },
//           sender_id: { type: 'number', example: 1, nullable: true },
//           admin_id: { type: 'number', example: null, nullable: true },
//           created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:21:00.000Z' },
//           users: {
//             type: 'object',
//             properties: {
//               username: { type: 'string', example: 'john_doe' },
//               profile: { type: 'string', example: 'profile.jpg', nullable: true },
//             },
//           },
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 400, description: 'Bad Request - Failed to retrieve messages' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   async getCommunityMessages() {
//     try {
//       return await this.chatService.getCommunityMessages({});
//     } catch (error) {
//       throw new BadRequestException(error.message || 'Failed to retrieve community messages');
//     }
//   }
// }
import { Controller, Get, Post, Body, Query, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.gurad';
import { Request } from 'express';

interface JwtPayload {
  id: number;
  [key: string]: any;
}

@ApiTags('Chats')
@ApiBearerAuth()
@Controller('/chats')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('/create')
  @ApiOperation({ summary: 'Create a new normal chat between two users' })
  @ApiBody({
    description: 'User IDs for the chat participants (must exist in users table)',
    schema: {
      type: 'object',
      required: ['user1Id', 'user2Id'],
      properties: {
        user1Id: { type: 'number', description: 'ID of the first user', example: 1 },
        user2Id: { type: 'number', description: 'ID of the second user', example: 2 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Chat created successfully or already exists',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Chat created successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            user1_id: { type: 'number', example: 1 },
            user2_id: { type: 'number', example: 2 },
            created_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid user IDs, same user ID, or users not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async createChat(@Body() body: { user1Id: number; user2Id: number }) {
    try {
      return await this.chatService.createChat(body.user1Id, body.user2Id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create chat');
    }
  }

  @Get('/messages')
  @ApiOperation({ summary: 'Retrieve all messages for a specific normal chat' })
  @ApiQuery({
    name: 'chatId',
    required: true,
    type: String,
    description: 'ID of the chat to retrieve messages for (must exist in chats table)',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Messages retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              chat_id: { type: 'number', example: 1 },
              sender_id: { type: 'number', example: 1 },
              message_text: { type: 'string', example: 'Hello!' },
              sent_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
              is_read: { type: 'boolean', example: false },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid or non-existent chat ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getMessages(@Query('chatId') chatId: string) {
    try {
      const parsedChatId = parseInt(chatId);
      if (isNaN(parsedChatId)) {
        throw new BadRequestException('Invalid chat ID');
      }
      return await this.chatService.getMessages(parsedChatId);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to retrieve messages');
    }
  }

  @Get('/buyers-and-sellers')
  @ApiOperation({ summary: 'Retrieve buyers and sellers for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Buyers and sellers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Buyers and sellers retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            buyers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'john_doe' },
                  first_name: { type: 'string', example: 'John', nullable: true },
                  last_name: { type: 'string', example: 'Doe', nullable: true },
                  is_seller: { type: 'boolean', example: false },
                  profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
                  last_message: {
                    type: 'object',
                    properties: {
                      message_text: { type: 'string', example: 'Hello!' },
                      sent_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
                      is_read: { type: 'boolean', example: false },
                    },
                    nullable: true,
                  },
                  chat_id: { type: 'number', example: 1 },
                  unread_count: { type: 'number', example: 2 },
                },
              },
            },
            sellers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 2 },
                  username: { type: 'string', example: 'jane_seller' },
                  first_name: { type: 'string', example: 'Jane', nullable: true },
                  last_name: { type: 'string', example: 'Seller', nullable: true },
                  is_seller: { type: 'boolean', example: true },
                  profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
                  last_message: {
                    type: 'object',
                    properties: {
                      message_text: { type: 'string', example: 'Hello!' },
                      sent_at: { type: 'string', format: 'date-time', example: '2025-05-27T01:38:00.000Z' },
                      is_read: { type: 'boolean', example: false },
                    },
                    nullable: true,
                  },
                  chat_id: { type: 'number', example: 2 },
                  unread_count: { type: 'number', example: 1 },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid user ID or failed to retrieve data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getBuyersAndSellers(@Req() request: Request & { user: JwtPayload }) {
    try {
      return await this.chatService.getBuyersAndSellers(request.user.id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to retrieve buyers and sellers');
    }
  }

  @Get('/community/messages')
  @ApiOperation({ summary: 'Retrieve all messages for the community chat' })
  @ApiResponse({
    status: 200,
    description: 'Community messages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          content: { type: 'string', example: 'Hello community!' },
          is_admin: { type: 'boolean', example: false },
          sender_id: { type: 'number', example: 1, nullable: true },
          admin_id: { type: 'number', example: null, nullable: true },
          created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:21:00.000Z' },
          users: {
            type: 'object',
            properties: {
              username: { type: 'string', example: 'john_doe' },
              profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
            },
          },
          reactions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                emoji_type: { type: 'string', example: '👍' },
                user_id: { type: 'number', example: 1 },
                username: { type: 'string', example: 'john_doe' },
                created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:22:00.000Z' },
              },
            },
          },
          reaction_counts: {
            type: 'object',
            additionalProperties: { type: 'number' },
            example: { '👍': 2, '❤️': 1 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Failed to retrieve messages' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getCommunityMessages() {
    try {
      return await this.chatService.getCommunityMessages({});
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to retrieve community messages');
    }
  }

  @Get('/community/top-reacted')
  @ApiOperation({ summary: 'Retrieve the top 4 most reacted community messages' })
  @ApiResponse({
    status: 200,
    description: 'Top reacted community messages retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Top reacted messages retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              content: { type: 'string', example: 'Hello community!' },
              is_admin: { type: 'boolean', example: false },
              sender_id: { type: 'number', example: 1, nullable: true },
              admin_id: { type: 'number', example: null, nullable: true },
              created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:21:00.000Z' },
              users: {
                type: 'object',
                properties: {
                  username: { type: 'string', example: 'john_doe' },
                  profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
                },
              },
              reactions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    emoji_type: { type: 'string', example: '👍' },
                    user_id: { type: 'number', example: 1 },
                    username: { type: 'string', example: 'john_doe' },
                    created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:22:00.000Z' },
                  },
                },
              },
              reaction_counts: {
                type: 'object',
                additionalProperties: { type: 'number' },
                example: { '👍': 2, '❤️': 1 },
              },
              total_reactions: { type: 'number', example: 3 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Failed to retrieve messages' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getTopReactedMessages() {
    try {
      return await this.chatService.getTopReactedMessages();
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to retrieve top reacted messages');
    }
  }
}