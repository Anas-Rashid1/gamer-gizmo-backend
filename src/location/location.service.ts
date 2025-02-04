import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLocationDto } from './dto/createlocation.dto';
import { DeleteLocationsDto } from './dto/deletelocation.dto';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}
  async GetAllLocation() {
    try {
      const locs = await this.prisma.location.findMany();
      return { message: 'Success', data: locs };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async DeleteLocation({ id }: DeleteLocationsDto) {
    try {
      const loc = await this.prisma.location.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      if (!loc) {
        throw new BadRequestException(`Location with id ${id} does not exist.`);
      }

      // Delete the brand from the database
      await this.prisma.location.delete({
        where: {
          id: parseInt(id),
        },
      });

      return { message: 'Successfully Deleted' };
    } catch (e) {
      console.error('Error deleting brand:', e);
      throw new InternalServerErrorException(
        e.message || 'Failed to delete the brand.',
      );
    }
  }

  async createLocation(data: CreateLocationDto) {
    try {
      const loc = await this.prisma.location.create({
        data: {
          name: data.name,
        },
      });
      return { message: 'Successfully Created' };
    } catch (e) {
      console.log(e, 'pak');
      throw new InternalServerErrorException(e);
    }
  }
}
