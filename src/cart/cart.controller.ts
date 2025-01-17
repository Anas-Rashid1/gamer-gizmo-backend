import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';

import { CartService } from './cart.service';
import { CreateReviewDto } from './dto/review.dto';

@ApiTags('Cart')
@Controller('/cart')
export class CartContoller {
  constructor(private readonly cartService: CartService) {}
  //   @ApiBearerAuth()ProductService
  //   @UseGuards(AuthGuard)

  @ApiQuery({
    name: 'user_id',
    required: true, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'pageNo',
    required: false, // Make category optional
    type: String,
  })
  @Get('/getUserCart')
  async getAllProducts(@Query() query: any) {
    return this.cartService.getUserCarts(query);
  }

  @Post('/addItemToCart')
  async GetProductById(@Query() id: string) {
    return this.cartService.AddItemToCart(id, 'images');
  }

  @Delete('/removeItemFromCart')
  @ApiQuery({
    name: 'user_id',
    required: true, // Make category optional
    type: String,
  })
  @ApiQuery({
    name: 'product_id',
    required: true, // Make category optional
    type: String,
  })
  async DeleteProductById(@Query() id: string) {
    return this.cartService.DeleteProductById(id);
  }
}
