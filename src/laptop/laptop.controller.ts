import { Controller, Get, UseGuards } from '@nestjs/common';
import { laptopService } from './laptop.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';

@ApiTags('Laptop Products')
@Controller('/laptop')
export class LaptopContoller {
  constructor(private readonly laptopService: laptopService) {}
  //   @ApiBearerAuth()
  //   @UseGuards(AuthGuard)
  @Get('/getAllLaptops')
  async getAllLaptops() {
    return this.laptopService.GetAllLaptops();
  }
}
