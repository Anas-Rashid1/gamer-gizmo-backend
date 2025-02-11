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
import {  CreateModelsto } from './dto/createmodel.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {  GetModlesDto } from './dto/getmodels.dto';
import { ModelService } from './model.service';
import { DeleteModelsDto } from './dto/deletemodel.dto';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

@ApiTags('Brands Model')
@Controller('/models')
export class ModelContoller {
  constructor(private readonly modelService: ModelService) {}
  @Get('/getAll')
  @ApiQuery({
    name: 'brand',
    required: true, 
    type: String,
  })
  @ApiQuery({
    name: 'pageNo',
    required: false, 
    type: Number,
    description:
      'Page number for pagination (if not provided, all brands will be returned)',
  })
  async GetAllModels(@Query() { brand, pageNo = null }: GetModlesDto) {
    return this.modelService.GetAllModels({ brand, pageNo });
  }
 
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)  
  @Post('/create')
  async createModel(
    @Body() CreateModelsDto: CreateModelsto,
  ) {
    return this.modelService.createModel(CreateModelsDto);
  }
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Delete('/delete')
  async deleteModel(@Query() id: DeleteModelsDto) {
    return this.modelService.DeleteModel(id);
  }
}
