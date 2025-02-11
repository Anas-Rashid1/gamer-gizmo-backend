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
import { CreateProcessor, CreateVariant } from './dto/createvariant.dto';
import { GetProcessorDto } from './dto/getmodels.dto';
import { ProcessorService } from './processor.service';
import { DeleteVariantsDto } from './dto/deleteVariantdto';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

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
    @ApiBearerAuth()
    @UseGuards(AdminAuthGuard)
  @Post('/createVariant')
  async CreateVariant(@Body() data: CreateVariant) {
    return this.processorService.CreateVariant(data);
  }
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post('/createProcessor')
  async createProcessor(@Body() data: CreateProcessor) {
    return this.processorService.createProcessor(data);
  }
  @ApiBearerAuth()
    @UseGuards(AdminAuthGuard)
  @Delete('/deleteVariant')
  async deleteVariant(@Query() data: DeleteVariantsDto) {
    return this.processorService.DeleteProcessorVariant(data);
  }
  @ApiBearerAuth()
    @UseGuards(AdminAuthGuard)
  @Delete('/deleteProcessor')
  async deleteProcessor(@Query() data: DeleteVariantsDto) {
    return this.processorService.deleteProcessor(data);
  }
}
