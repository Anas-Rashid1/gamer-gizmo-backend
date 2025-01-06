import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';
import { CreateCategoriesDto } from './dto/categories.dto';

@ApiTags('Products Categories')
@Controller('/categories')
export class CategoriesContoller {
  constructor(private readonly categoriesService: CategoriesService) {}
  //   @ApiBearerAuth()
  //   @UseGuards(AuthGuard)
  @Get('/getAll')
  async GetAllCategories() {
    return this.categoriesService.GetAllCategories();
  }
  @Post('/create')
  async createCategory(@Body() CreateCategoriesDto: CreateCategoriesDto) {
    return this.categoriesService.createCategory(CreateCategoriesDto);
  }
}
