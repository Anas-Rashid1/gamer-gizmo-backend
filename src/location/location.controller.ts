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
import { AuthGuard } from 'src/auth/auth.gurad';
import { CreateLocationDto } from './dto/createlocation.dto';
import { LocationService } from './location.service';
import { DeleteLocationsDto } from './dto/deletelocation.dto';

@ApiTags('Locations')
@Controller('/location')
export class LocationContoller {
  constructor(private readonly locationService: LocationService) {}
  @Get('/getAll')
  async GetAllModels() {
    return this.locationService.GetAllLocation();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('/create')
  async createModel(@Body() CreateModelsDto: CreateLocationDto) {
    return this.locationService.createLocation(CreateModelsDto);
  }
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete('/delete')
  async deleteModel(@Query() id: DeleteLocationsDto) {
    return this.locationService.DeleteLocation(id);
  }
}
