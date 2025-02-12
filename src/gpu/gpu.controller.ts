import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GPUService } from './gpu.service';
import {  ApiTags } from '@nestjs/swagger';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';

@ApiTags('GPU')
@Controller('/gpu')
export class GPUContoller {
  constructor(private readonly gpuService: GPUService) {}
  @Get('/getAll')
  async GetAllGPU() {
    return this.gpuService.GetAllGPU();
  }
  @Post('/create')
  async CreateGPU(@Body() CreateCategoriesDto: CreateRamDto) {
    return this.gpuService.CreateGPU(CreateCategoriesDto);
  }
  @Delete('/delete')
  async DeleteGPU(@Query() data:DeleteDto) {
    return this.gpuService.DeleteGPU(data);
  }
}
