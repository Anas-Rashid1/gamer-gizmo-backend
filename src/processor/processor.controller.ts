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
import { CreateProcessor, CreateVariant } from './dto/createvariant.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GetProcessorDto } from './dto/getmodels.dto';
import { ProcessorService } from './processor.service';
import { DeleteVariantsDto } from './dto/deleteVariantdto';

@ApiTags('Processors')
@Controller('/processor')
export class ProcessorContoller {
  constructor(private readonly processorService: ProcessorService) {}

  @Get('/getProcessor')
  @ApiQuery({
    name: 'variant',
    required: true,
    type: String,
  })
  async GetProcessorVariant(@Query() { variant }: GetProcessorDto) {
    return this.processorService.GetAllProcessors({ variant });
  }
  @Get('/getProcessorVariant')
  async GetProcessor() {
    return this.processorService.GetAllVariants();
  }
  @Post('/createVariant')
  async CreateVariant(@Body() data: CreateVariant) {
    return this.processorService.CreateVariant(data);
  }

  @Post('/createProcessor')
  async createProcessor(@Body() data: CreateProcessor) {
    return this.processorService.createProcessor(data);
  }
  @Delete('/deleteVariant')
  async deleteVariant(@Body() data: DeleteVariantsDto) {
    return this.processorService.DeleteProcessorVariant(data);
  }
  @Delete('/deleteProcessor')
  async deleteProcessor(@Body() data: DeleteVariantsDto) {
    return this.processorService.deleteProcessor(data);
  }
}
