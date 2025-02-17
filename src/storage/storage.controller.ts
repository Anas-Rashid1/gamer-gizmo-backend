import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

@ApiTags('Storage')
@Controller('/storage')
export class RamContoller {
  constructor(private readonly storageService: StorageService) {}
  @Get('/getStorage')
  async getStorage() {
    return this.storageService.GetStorage();
  }
   @ApiBearerAuth()
      @UseGuards(AdminAuthGuard)
  @Post('/createStorage')
  async createStorage(@Body() CreateCategoriesDto: CreateRamDto) {
    return this.storageService.CreateStorage(CreateCategoriesDto);
  }
   @ApiBearerAuth()
      @UseGuards(AdminAuthGuard)
  @Delete('/deleteStorage')
  async deleteStorage(@Query() data:DeleteDto) {
    return this.storageService.DeleteStorage(data);
  }
  
  @Get('/getStorageType')
  async getStorageType() {
    return this.storageService.GetStorageType();
  }
   @ApiBearerAuth()
      @UseGuards(AdminAuthGuard)
  @Post('/createStorageType')
  async createStorageType(@Body() CreateCategoriesDto: CreateRamDto) {
    return this.storageService.CreateStorageType(CreateCategoriesDto);
  }
   @ApiBearerAuth()
      @UseGuards(AdminAuthGuard)
  @Delete('/deleteStorageType')
  async deleteStorageType(@Query() data:DeleteDto) {
    return this.storageService.DeleteStorageType(data);
  }
}
