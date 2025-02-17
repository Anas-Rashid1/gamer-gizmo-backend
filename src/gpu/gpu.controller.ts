import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GPUService } from './gpu.service';
import {  ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

@ApiTags('GPU')
@Controller('/gpu')
export class GPUContoller {
  constructor(private readonly gpuService: GPUService) {}
  @Get('/getAll')
  async GetAllGPU() {
    return this.gpuService.GetAllGPU();
  }
   @ApiBearerAuth()
      @UseGuards(AdminAuthGuard)
  @Post('/create')
  async CreateGPU(@Body() CreateCategoriesDto: CreateRamDto) {
    return this.gpuService.CreateGPU(CreateCategoriesDto);
  }
   @ApiBearerAuth()
      @UseGuards(AdminAuthGuard)
  @Delete('/delete')
  async DeleteGPU(@Query() data:DeleteDto) {
    return this.gpuService.DeleteGPU(data);
  }
}
