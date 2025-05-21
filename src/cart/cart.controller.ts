// import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
// import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
// import { AuthGuard } from 'src/auth/auth.gurad';

// import { CartService } from './cart.service';
// import { CreateReviewDto } from './dto/review.dto';

// @ApiTags('Cart')
// @Controller('/cart')
// export class CartContoller {
//   constructor(private readonly cartService: CartService) {}
//   //   @ApiBearerAuth()ProductService
//   //   @UseGuards(AuthGuard)

//   @ApiQuery({
//     name: 'user_id',
//     required: true, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'pageNo',
//     required: false, // Make category optional
//     type: String,
//   })
//   @Get('/getUserCart')
//   async getAllProducts(@Query() query: any) {
//     return this.cartService.getUserCarts(query);
//   }

//   @Post('/addItemToCart')
//   async GetProductById(@Query() id: string) {
//     return "this.cartService.AddItemToCart(id, 'images')";
//   }

//   @Delete('/removeItemFromCart')
//   @ApiQuery({
//     name: 'user_id',
//     required: true, // Make category optional
//     type: String,
//   })
//   @ApiQuery({
//     name: 'product_id',
//     required: true, // Make category optional
//     type: String,
//   })
//   async DeleteProductById(@Query() id: string) {
//     return this.cartService.DeleteProductById(id);
//   }
// }
import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/cart.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Add an item to the cart (store products only, authenticated user)' })
  @ApiBody({ type: AddCartItemDto })
  @ApiResponse({ status: 201, description: 'Item added to cart successfully', type: Object })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input, insufficient stock, or non-store product' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  addItem(@Body() addCartItemDto: AddCartItemDto, @Req() request: Request & { user: JwtPayload }) {
    return this.cartService.addItem(addCartItemDto, request.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve the user\'s cart (store products only, authenticated user)' })
  @ApiResponse({ status: 200, description: 'Cart details with store product items', type: Object })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  getCart(@Req() request: Request & { user: JwtPayload }) {
    return this.cartService.getCart(request.user.id);
  }

  @Delete('item/:productId')
  @ApiOperation({ summary: 'Remove a specific item from the cart (authenticated user)' })
  @ApiParam({ name: 'productId', type: Number, description: 'Product ID to remove' })
  @ApiResponse({ status: 200, description: 'Item removed from cart successfully', type: Object })
  @ApiResponse({ status: 404, description: 'Not Found - Item not in cart' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  removeItem(@Param('productId', ParseIntPipe) productId: number, @Req() request: Request & { user: JwtPayload }) {
    return this.cartService.removeItem(request.user.id, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from the cart (authenticated user)' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully', type: Object })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  clearCart(@Req() request: Request & { user: JwtPayload }) {
    return this.cartService.clearCart(request.user.id);
  }
}