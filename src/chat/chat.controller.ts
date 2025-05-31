import { Controller, Get, Post, Body, Query, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.gurad';
import { Request } from 'express';

// Define JwtPayload interface locally
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
  @ApiOperation({ summary: 'Create a new chat between two users' })
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
        message: { type: 'string', description: 'Response message', example: 'Chat created successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Chat ID', example: 1 },
            user1_id: { type: 'number', description: 'ID of the first user', example: 1 },
            user2_id: { type: 'number', description: 'ID of the second user', example: 2 },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp', example: '2025-05-27T01:38:00.000Z' },
            updated_at: { type: 'string', format: 'date-time', description: 'Update timestamp', example: '2025-05-27T01:38:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid user IDs, same user ID, or users not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async createChat(@Body() body: { user1Id: number; user2Id: number }) {
    try {
      return await this.chatService.createChat(body.user1Id, body.user2Id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create chat');
    }
  }

  @Get('/messages')
  @ApiOperation({ summary: 'Retrieve all messages for a specific chat' })
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
        message: { type: 'string', description: 'Response message', example: 'Messages retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Message ID', example: 1 },
              chat_id: { type: 'number', description: 'Chat ID', example: 1 },
              sender_id: { type: 'number', description: 'Sender user ID', example: 1 },
              message_text: { type: 'string', description: 'Message content', example: 'Hello!' },
              sent_at: { type: 'string', format: 'date-time', description: 'Timestamp when message was sent', example: '2025-05-27T01:38:00.000Z' },
              is_read: { type: 'boolean', description: 'Whether the message has been read', example: false },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid or non-existent chat ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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

  // chat.controller.ts

  @Get('/buyers-and-sellers')
  @ApiOperation({ summary: 'Retrieve buyers and sellers for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Buyers (user1_id where authenticated user is user2_id) and sellers (user2_id where authenticated user is user1_id) retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Response message', example: 'Buyers and sellers retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            buyers: {
              type: 'array',
              items: { type: 'number' },
              description: 'Array of unique buyer user IDs (user1_id where authenticated user is user2_id)',
              example: [1, 3, 5],
            },
            sellers: {
              type: 'array',
              items: { type: 'number' },
              description: 'Array of unique seller user IDs (user2_id where authenticated user is user1_id)',
              example: [2, 4, 6],
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid user ID or failed to retrieve data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async getBuyersAndSellers(@Req() request: Request & { user: JwtPayload }) {
    try {
      return await this.chatService.getBuyersAndSellers(request.user.id);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to retrieve buyers and sellers');
    }
  }
}