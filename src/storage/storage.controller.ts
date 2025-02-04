import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';

@ApiTags('Storage')
@Controller('/storage')
export class RamContoller {
  constructor(private readonly storageService: StorageService) {}
  @Get('/getStorage')
  async getStorage() {
    return this.storageService.GetStorage();
  }
  @Post('/createStorage')
  async createStorage(@Body() CreateCategoriesDto: CreateRamDto) {
    return this.storageService.CreateStorage(CreateCategoriesDto);
  }
  @Delete('/deleteStorage')
  async deleteStorage(@Query() data:DeleteDto) {
    return this.storageService.DeleteStorage(data);
  }
  @Get('/getStorageType')
  async getStorageType() {
    return this.storageService.GetStorageType();
  }
  @Post('/createStorageType')
  async createStorageType(@Body() CreateCategoriesDto: CreateRamDto) {
    return this.storageService.CreateStorageType(CreateCategoriesDto);
  }
  @Delete('/deleteStorageType')
  async deleteStorageType(@Query() data:DeleteDto) {
    return this.storageService.DeleteStorageType(data);
  }
}
