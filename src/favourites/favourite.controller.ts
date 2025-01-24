import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';

import { AddToFavouriteService } from './favourite.service';
import { AddToFavouriteDto } from './dto/addToFav.Dto';

@ApiTags('Fvourite Products')
@Controller('/product/favourite')
export class AddToFavouriteContoller {
  constructor(private readonly favouriteService: AddToFavouriteService) {}
  //   @ApiBearerAuth()ProductService
  //   @UseGuards(AuthGuard)
  @ApiQuery({
    name: 'userId',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'pageNo',
    required: false,
    type: String,
  })
  @Get('/getAll')
  async getAllProducts(@Query() query: any) {
    return this.favouriteService.GetAllFavourites(query);
  }

  @Delete('/removeFavourite')
  @ApiQuery({
    name: 'userId',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'productId',
    required: true,
    type: String,
  })
  async DeleteProductById(@Query() id: AddToFavouriteDto) {
    return this.favouriteService.RemoveFavourite(id);
  }

  @Post('/addToFavourite')
  async AddToFavourite(@Body() data: AddToFavouriteDto) {
    return this.favouriteService.AddToFavourite(data);
  }
}
