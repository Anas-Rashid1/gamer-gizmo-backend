import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ConditionService } from './condition.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

@ApiTags('Condition')
@Controller('/conditions')
export class ConditionContoller {
  constructor(private readonly conditionService: ConditionService) {}
  @Get('/getAll')
  async GetAllCondition() {
    return this.conditionService.GetAllCondition();
  }
  @ApiBearerAuth()
    @UseGuards(AdminAuthGuard)
  @Post('/create')
  async CreateCondition(@Body() CreateCategoriesDto: CreateRamDto) {
    return this.conditionService.CreateCondition(CreateCategoriesDto);
  }
  @ApiBearerAuth()
    @UseGuards(AdminAuthGuard)
  @Delete('/delete')
  async DeleteCondition(@Query() data:DeleteDto) {
    return this.conditionService.DeleteCondition(data);
  }
}
