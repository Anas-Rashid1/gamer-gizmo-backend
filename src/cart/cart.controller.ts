

// import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
// import { CartService } from './cart.service';
// import { AddCartItemDto } from './dto/cart.dto';
// import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
// import { AuthGuard } from 'src/auth/auth.gurad';
// import { Request } from 'express';

// // Define JwtPayload interface locally
// interface JwtPayload {
//   id: number;
//   [key: string]: any;
// }

// @ApiTags('Cart')
// @ApiBearerAuth()
// @Controller('cart')
// @UseGuards(AuthGuard)
// export class CartController {
//   constructor(private readonly cartService: CartService) {}

//   @Post()
//   @ApiOperation({ summary: 'Add an item to the cart (store products only, authenticated user)' })
//   @ApiBody({ type: AddCartItemDto })
//   @ApiResponse({ status: 201, description: 'Item added to cart successfully', type: Object })
//   @ApiResponse({ status: 400, description: 'Bad Request - Invalid input, insufficient stock, or non-store product' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   addItem(@Body() addCartItemDto: AddCartItemDto, @Req() request: Request & { user: JwtPayload }) {
//     return this.cartService.addItem(addCartItemDto, request.user.id);
//   }

//   @Get()
//   @ApiOperation({ summary: 'Retrieve the user\'s cart (store products only, authenticated user)' })
//   @ApiResponse({ status: 200, description: 'Cart details with store product items', type: Object })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   getCart(@Req() request: Request & { user: JwtPayload }) {
//     return this.cartService.getCart(request.user.id);
//   }

//   @Delete('item/:productId')
//   @ApiOperation({ summary: 'Remove a specific item from the cart (authenticated user)' })
//   @ApiParam({ name: 'productId', type: Number, description: 'Product ID to remove' })
//   @ApiResponse({ status: 200, description: 'Item removed from cart successfully', type: Object })
//   @ApiResponse({ status: 404, description: 'Not Found - Item not in cart' })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   removeItem(@Param('productId', ParseIntPipe) productId: number, @Req() request: Request & { user: JwtPayload }) {
//     return this.cartService.removeItem(request.user.id, productId);
//   }

//   @Delete()
//   @ApiOperation({ summary: 'Clear all items from the cart (authenticated user)' })
//   @ApiResponse({ status: 200, description: 'Cart cleared successfully', type: Object })
//   @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
//   clearCart(@Req() request: Request & { user: JwtPayload }) {
//     return this.cartService.clearCart(request.user.id);
//   }
// }

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/cart.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';
import { Request } from 'express';

// Define JwtPayload interface locally
interface JwtPayload {
  id: number;
  [key: string]: any;
}

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(AuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({
    summary: 'Add an item to the cart (store products only, authenticated user)',
  })
  @ApiBody({ type: AddCartItemDto })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Cart item ID' },
        cart_id: { type: 'number', description: 'Cart ID' },
        product_id: { type: 'number', description: 'Product ID' },
        quantity: { type: 'number', description: 'Quantity' },
        price: { type: 'string', description: 'Price' },
        created_at: { type: 'string', format: 'date-time', description: 'Creation date' },
        updated_at: { type: 'string', format: 'date-time', description: 'Update date' },
        product: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Product ID' },
            name: { type: 'string', description: 'Product name' },
            price: { type: 'string', description: 'Product price' },
            stock: { type: 'string', description: 'Product stock' },
            is_store_product: { type: 'boolean', description: 'Is store product' },
            product_images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', description: 'Image ID' },
                  image_url: { type: 'string', description: 'Signed S3 URL for the image' },
                  created_at: { type: 'string', format: 'date-time', description: 'Creation date' },
                },
              },
            },
          },
        },
        cart: {
          type: 'object',
          properties: {
            id: { type: 'number', description: 'Cart ID' },
            user_id: { type: 'number', description: 'User ID' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input, insufficient stock, or non-store product',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  addItem(@Body() addCartItemDto: AddCartItemDto, @Req() request: Request & { user: JwtPayload }) {
    return this.cartService.addItem(addCartItemDto, request.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve the user's cart (store products only, authenticated user)" })
  @ApiResponse({
    status: 200,
    description: 'Cart details with store product items and signed image URLs',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Cart ID', nullable: true },
        user_id: { type: 'number', description: 'User ID' },
        cart_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Cart item ID' },
              product_id: { type: 'number', description: 'Product ID' },
              quantity: { type: 'number', description: 'Quantity' },
              price: { type: 'string', description: 'Price' },
              created_at: { type: 'string', format: 'date-time', description: 'Creation date' },
              updated_at: { type: 'string', format: 'date-time', description: 'Update date' },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'number', description: 'Product ID' },
                  name: { type: 'string', description: 'Product name' },
                  price: { type: 'string', description: 'Product price' },
                  stock: { type: 'string', description: 'Product stock' },
                  is_store_product: { type: 'boolean', description: 'Is store product' },
                  product_images: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', description: 'Image ID' },
                        image_url: { type: 'string', description: 'Signed S3 URL for the image' },
                        created_at: { type: 'string', format: 'date-time', description: 'Creation date' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        users: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'number', description: 'User ID' },
            username: { type: 'string', description: 'Username' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  getCart(@Req() request: Request & { user: JwtPayload }) {
    return this.cartService.getCart(request.user.id);
  }

  @Delete('item/:productId')
  @ApiOperation({ summary: 'Remove a specific item from the cart (authenticated user)' })
  @ApiParam({ name: 'productId', type: Number, description: 'Product ID to remove' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
    type: Object,
  })
  @ApiResponse({ status: 404, description: 'Not Found - Item not in cart' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  removeItem(
    @Param('productId', ParseIntPipe) productId: number,
    @Req() request: Request & { user: JwtPayload },
  ) {
    return this.cartService.removeItem(request.user.id, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from the cart (authenticated user)' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  clearCart(@Req() request: Request & { user: JwtPayload }) {
    return this.cartService.clearCart(request.user.id);
  }
}