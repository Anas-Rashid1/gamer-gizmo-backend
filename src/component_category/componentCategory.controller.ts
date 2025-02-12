import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';
import { CreateCatDto } from './dto/createCatdto';
import { GetCatData } from './dto/getcat.dto';
import { ComponentCategoryService } from './componentCategory.service';
import { DeleteCatDto } from './dto/deleteCat.dto';

@ApiTags('Component Category')
@Controller('/component-category')
export class ComponentCategoryController {
  constructor(
    private readonly componentCategoryService: ComponentCategoryService,
  ) {}
  @Get('/getAll')
 
  @ApiQuery({
    name: 'pageNo',
    required: false, // Make pageNo optional
    type: Number,
    description:
      'Page number for pagination (if not provided, all brands will be returned)',
  })
  async GetAllCategories(@Query() { pageNo = null }: GetCatData) {
    return this.componentCategoryService.GetAllCategories({ pageNo });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('/create')
  async createCategories(@Body() CatDto: CreateCatDto) {
    return this.componentCategoryService.createCategories(CatDto);
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('/delete')
  async DeleteCategory(@Query() id: DeleteCatDto) {
    return this.componentCategoryService.DeleteCategory(id);
  }
}
