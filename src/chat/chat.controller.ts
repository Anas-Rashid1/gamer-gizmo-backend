
import { Controller, Get, Post, Put, Delete, Body, Query, Param, BadRequestException, UseGuards, Req,UseInterceptors,UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth, ApiParam,ApiConsumes } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.gurad';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';
import { AuthOrAdminGuard } from 'src/auth/authoradmin.guard';
import { Request } from 'express';

interface JwtPayload {
  id: number;
  [key: string]: any;
}

@ApiTags('Chats')
@ApiBearerAuth()
@Controller('/chats')
@UseGuards(AuthOrAdminGuard)
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
@ApiOperation({ summary: 'Retrieve all messages for a community chat' })
@ApiQuery({
  name: 'communityChatId',
  required: true,
  type: String,
  description: 'ID of the community chat to retrieve messages for',
  example: '1',
})
@ApiQuery({
  name: 'beforeId',
  required: false,
  type: String,
  description: 'ID of the message to fetch messages before (for pagination)',
  example: '10',
})
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
        user_admin_id: { type: 'number', example: null, nullable: true },
        community_chat_id: { type: 'number', example: 1 },
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
@ApiResponse({ status: 400, description: 'Bad Request - Invalid community chat ID or beforeId' })
@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
async getCommunityMessages(
  @Query('communityChatId') communityChatId: string,
  @Query('beforeId') beforeId: string,
  @Req() request: Request & { user: JwtPayload },
) {
  try {
    const parsedChatId = parseInt(communityChatId);
    const parsedBeforeId = beforeId ? parseInt(beforeId) : undefined;
    if (isNaN(parsedChatId)) {
      throw new BadRequestException('Invalid community chat ID');
    }
    if (beforeId && isNaN(parsedBeforeId)) {
      throw new BadRequestException('Invalid beforeId');
    }
    return await this.chatService.getCommunityMessages(parsedChatId, request.user.id, { beforeId: parsedBeforeId });
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

  @Get('/community/messages/:communityChatId')
  @ApiOperation({ summary: 'Retrieve messages for a specific community chat' })
  @ApiParam({
    name: 'communityChatId',
    required: true,
    type: String,
    description: 'ID of the community chat to retrieve messages for',
    example: '1',
  })
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
          user_admin_id: { type: 'number', example: null, nullable: true },
          community_chat_id: { type: 'number', example: 1 },
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
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid community chat ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getCommunityChatMessages(@Param('communityChatId') communityChatId: string, @Req() request: Request & { user: JwtPayload }) {
    try {
      const parsedChatId = parseInt(communityChatId);
      if (isNaN(parsedChatId)) {
        throw new BadRequestException('Invalid community chat ID');
      }
      return await this.chatService.getCommunityChatMessages(parsedChatId, request.user.id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to retrieve community chat messages');
    }
  }

  @Get('/community/list')
  @ApiOperation({ summary: 'Retrieve a limited number of community chats with their details' })
  @ApiQuery({
    name: 'limit',
    required: true,
    type: Number,
    description: 'Number of community chats to retrieve',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'Community chats retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Community chats retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Gaming News' },
              description: { type: 'string', example: 'A place to discuss the latest gaming updates', nullable: true },
              wallpaper: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/wallpaper.jpg?signed', nullable: true },
              creator: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1, nullable: true },
                  username: { type: 'string', example: 'john_doe', nullable: true },
                  profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
                },
              },
              admins: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 2 },
                    username: { type: 'string', example: 'jane_doe' },
                    profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
                  },
                },
              },
              latest_message: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  content: { type: 'string', example: 'Hello community!' },
                  created_at: { type: 'string', format: 'date-time', example: '2025-06-10T12:21:00.000Z' },
                  users: {
                    type: 'object',
                    properties: {
                      username: { type: 'string', example: 'john_doe' },
                      profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
                    },
                  },
                },
                nullable: true,
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid limit parameter' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getCommunityChats(@Query('limit') limit: string, @Req() request: Request & { user: JwtPayload }) {
    try {
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        throw new BadRequestException('Invalid limit parameter');
      }
      return await this.chatService.getCommunityChats(parsedLimit, request.user.id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to retrieve community chats');
    }
  }

  
  @Post('/community/create')
@UseInterceptors(
  FileInterceptor('file', {
    storage: memoryStorage(),
  }),
)
@ApiOperation({ summary: 'Create a new community chat with a name, optional description, and optional wallpaper' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'Details for the new community chat',
  schema: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', description: 'Name of the community chat', example: 'Gaming News' },
      description: { type: 'string', description: 'Description of the community chat', example: 'A place to discuss the latest gaming updates', nullable: true },
      file: { type: 'string', format: 'binary', description: 'Wallpaper file for the community chat', nullable: true },
    },
  },
})
@ApiResponse({
  status: 201,
  description: 'Community chat created successfully',
  schema: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Community chat created successfully' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Gaming News' },
          description: { type: 'string', example: 'A place to discuss the latest gaming updates', nullable: true },
          wallpaper: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/wallpaper.jpg?signed', nullable: true },
          creator_id: { type: 'number', example: 1, nullable: true },
          created_at: { type: 'string', format: 'date-time', example: '2025-06-20T11:59:00.000Z' },
        },
      },
    },
  },
})
@ApiResponse({ status: 400, description: 'Bad Request - Invalid name, user ID, or file' })
@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
async createCommunityChat(
  @Req() request: Request & { user: { id: number } },
  @Body() body: { name: string; description?: string },
  @UploadedFile() file?: Express.Multer.File,
) {
  try {
    return await this.chatService.createCommunityChat(body.name, body.description, file, request.user.id);
  } catch (error) {
    throw new BadRequestException(error.message || 'Failed to create community chat');
  }
}

@Put('/community/update-wallpaper/:communityChatId')
@UseInterceptors(
  FileInterceptor('file', {
    storage: memoryStorage(),
  }),
)
@ApiOperation({ summary: 'Update the wallpaper of a specific community chat' })
@ApiConsumes('multipart/form-data')
@ApiParam({
  name: 'communityChatId',
  required: true,
  type: String,
  description: 'ID of the community chat to update the wallpaper for',
  example: '1',
})
@ApiBody({
  description: 'New wallpaper for the community chat',
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary', description: 'Wallpaper file for the community chat', nullable: true },
    },
  },
})
@ApiResponse({
  status: 200,
  description: 'Community chat wallpaper updated successfully',
  schema: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Community chat wallpaper updated successfully' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Gaming News' },
          description: { type: 'string', example: 'A place to discuss the latest gaming updates', nullable: true },
          wallpaper: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/new_wallpaper.jpg?signed', nullable: true },
          creator_id: { type: 'number', example: 1, nullable: true },
          created_at: { type: 'string', format: 'date-time', example: '2025-06-20T11:59:00.000Z' },
        },
      },
    },
  },
})
@ApiResponse({ status: 400, description: 'Bad Request - Invalid community chat ID, file, or user not authorized' })
@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
async updateCommunityChatWallpaper(
  @Param('communityChatId') communityChatId: string,
  @Req() request: Request & { user: { id: number } },
  @UploadedFile() file?: Express.Multer.File,
) {
  try {
    const parsedChatId = parseInt(communityChatId);
    if (isNaN(parsedChatId)) {
      throw new BadRequestException('Invalid community chat ID');
    }
    return await this.chatService.updateCommunityChatWallpaper(parsedChatId, file, request.user.id);
  } catch (error) {
    throw new BadRequestException(error.message || 'Failed to update community chat wallpaper');
  }
}
  @Post('/community/ban-user/:communityChatId')
  @ApiOperation({ summary: 'Ban a user from a specific community chat' })
  @ApiParam({
    name: 'communityChatId',
    required: true,
    type: String,
    description: 'ID of the community chat to ban the user from',
    example: '1',
  })
  @ApiBody({
    description: 'User ID to ban from the community chat',
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'number', description: 'ID of the user to ban', example: 2 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User banned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User banned successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid community chat ID, user ID, or user not authorized' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async banUserFromCommunityChat(
    @Param('communityChatId') communityChatId: string,
    @Body() body: { userId: number },
    @Req() request: Request & { user: { id: number } }
  ) {
    try {
      const parsedChatId = parseInt(communityChatId);
      if (isNaN(parsedChatId)) {
        throw new BadRequestException('Invalid community chat ID');
      }
      return await this.chatService.banUserFromCommunityChat(parsedChatId, body.userId, request.user.id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to ban user');
    }
  }

  @Post('/community/unban-user/:communityChatId')
  @ApiOperation({ summary: 'Unban a user from a specific community chat' })
  @ApiParam({
    name: 'communityChatId',
    required: true,
    type: String,
    description: 'ID of the community chat to unban the user from',
    example: '1',
  })
  @ApiBody({
    description: 'User ID to unban from the community chat',
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'number', description: 'ID of the user to unban', example: 2 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User unbanned successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User unbanned successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid community chat ID, user ID, or user not authorized' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async unbanUserFromCommunityChat(
    @Param('communityChatId') communityChatId: string,
    @Body() body: { userId: number },
    @Req() request: Request & { user: { id: number } }
  ) {
    try {
      const parsedChatId = parseInt(communityChatId);
      if (isNaN(parsedChatId)) {
        throw new BadRequestException('Invalid community chat ID');
      }
      return await this.chatService.unbanUserFromCommunityChat(parsedChatId, body.userId, request.user.id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to unban user');
    }
  }

  @Post('/community/assign-admin/:communityChatId')
  @ApiOperation({ summary: 'Assign a user as an admin of a specific community chat' })
  @ApiParam({
    name: 'communityChatId',
    required: true,
    type: String,
    description: 'ID of the community chat to assign the admin to',
    example: '1',
  })
  @ApiBody({
    description: 'User ID to assign as admin',
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'number', description: 'ID of the user to assign as admin', example: 2 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User assigned as admin successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User assigned as admin successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid community chat ID, user ID, or user not authorized' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async assignCommunityChatAdmin(
    @Param('communityChatId') communityChatId: string,
    @Body() body: { userId: number },
    @Req() request: Request & { user: { id: number } }
  ) {
    try {
      const parsedChatId = parseInt(communityChatId);
      if (isNaN(parsedChatId)) {
        throw new BadRequestException('Invalid community chat ID');
      }
      return await this.chatService.assignCommunityChatAdmin(parsedChatId, body.userId, request.user.id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to assign admin');
    }
  }

  @Delete('/community/message/:messageId')
  @ApiOperation({ summary: 'Delete a message from a specific community chat' })
  @ApiParam({
    name: 'messageId',
    required: true,
    type: String,
    description: 'ID of the message to delete',
    example: '1',
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Message deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid message ID or user not authorized' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async deleteCommunityMessage(@Param('messageId') messageId: string, @Req() request: Request & { user: { id: number } }) {
    try {
      const parsedMessageId = parseInt(messageId);
      if (isNaN(parsedMessageId)) {
        throw new BadRequestException('Invalid message ID');
      }
      return await this.chatService.deleteCommunityMessage(parsedMessageId, request.user.id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete message');
    }
  }

@Delete('/community/delete/:communityChatId')
@ApiOperation({ summary: 'Delete a specific community chat' })
@ApiParam({
  name: 'communityChatId',
  required: true,
  type: String,
  description: 'ID of the community chat to delete',
  example: '1',
})
@ApiResponse({
  status: 200,
  description: 'Community chat deleted successfully',
  schema: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Community chat deleted successfully' },
    },
  },
})
@ApiResponse({ status: 400, description: 'Bad Request - Invalid community chat ID or user not authorized' })
@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
@ApiBearerAuth()
async deleteCommunityChat(
  @Param('communityChatId') communityChatId: string,
  @Req() request: Request & { user?: JwtPayload; admin?: JwtPayload },
) {
  try {
    const parsedChatId = parseInt(communityChatId);
    if (isNaN(parsedChatId)) {
      throw new BadRequestException('Invalid community chat ID');
    }
    // Use user.id or admin.id, whichever is available
    const requesterId = request.user?.id || request.admin?.id;
    if (!requesterId) {
      throw new BadRequestException('No valid user or admin ID found');
    }
    return await this.chatService.deleteCommunityChat(parsedChatId, requesterId);
  } catch (error) {
    throw new BadRequestException(error.message || 'Failed to delete community chat');
  }
}
@Get('/community/:communityChatId')
@ApiOperation({ summary: 'Retrieve a specific community chat with its details' })
@ApiParam({
  name: 'communityChatId',
  required: true,
  type: String,
  description: 'ID of the community chat to retrieve',
  example: '1',
})
@ApiResponse({
  status: 200,
  description: 'Community chat retrieved successfully',
  schema: {
    type: 'object',
    properties: {
      message: { type: 'string', example: 'Community chat retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Gaming News' },
          description: { type: 'string', example: 'A place to discuss the latest gaming updates', nullable: true },
          wallpaper: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/wallpaper.jpg?signed', nullable: true },
          creator_id: { type: 'number', example: 1, nullable: true },
          created_at: { type: 'string', format: 'date-time', example: '2025-06-20T11:59:00.000Z' },
          admins: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 2 },
                username: { type: 'string', example: 'jane_doe' },
                profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
              },
            },
          },
          banned_users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 3 },
                username: { type: 'string', example: 'bob_smith' },
                profile_picture: { type: 'string', example: 'https://gamergizmobucket.s3.eu-north-1.amazonaws.com/profile.jpg?signed', nullable: true },
              },
            },
          },
        },
      },
    },
  },
})
@ApiResponse({ status: 400, description: 'Bad Request - Invalid community chat ID or user banned' })
@ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
async getCommunityChat(
  @Param('communityChatId') communityChatId: string,
  @Req() request: Request & { user: JwtPayload },
) {
  try {
    const parsedChatId = parseInt(communityChatId);
    if (isNaN(parsedChatId)) {
      throw new BadRequestException('Invalid community chat ID');
    }
    return await this.chatService.getCommunityChat(parsedChatId, request.user.id);
  } catch (error) {
    throw new BadRequestException(error.message || 'Failed to retrieve community chat');
  }
}
}