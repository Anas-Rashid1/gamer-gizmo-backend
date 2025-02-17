import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateLocationDto } from './dto/createlocation.dto';
import { LocationService } from './location.service';
import { DeleteLocationsDto } from './dto/deletelocation.dto';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';

@ApiTags('Locations')
@Controller('/location')
export class LocationContoller {
  constructor(private readonly locationService: LocationService) {}
  @Get('/getAll')
  async GetAllModels() {
    return this.locationService.GetAllLocation();
  }

  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Post('/create')
  async createModel(@Body() CreateModelsDto: CreateLocationDto) {
    return this.locationService.createLocation(CreateModelsDto);
  }
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @Delete('/delete')
  async deleteModel(@Query() id: DeleteLocationsDto) {
    return this.locationService.DeleteLocation(id);
  }
}
