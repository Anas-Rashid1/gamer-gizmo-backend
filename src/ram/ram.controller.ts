import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RamService } from './ram.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

@ApiTags('Ram')
@Controller('/ram')
export class RamContoller {
  constructor(private readonly ramService: RamService) {}
  @Get('/getAll')
  async GetAllRam() {
    return this.ramService.GetAllRam();
  }
  @ApiBearerAuth()
    @UseGuards(AdminAuthGuard)
  @Post('/create')
  async createRam(@Body() CreateCategoriesDto: CreateRamDto) {
    return this.ramService.CreateRam(CreateCategoriesDto);
  }
  @ApiBearerAuth()
    @UseGuards(AdminAuthGuard)
  @Delete('/delete')
  async DeleteRam(@Query() data:DeleteDto) {
    return this.ramService.DeleteRam(data);
  }
}
