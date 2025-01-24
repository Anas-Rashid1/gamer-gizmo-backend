import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCatDto } from './dto/createCatdto';
import { GetCatData } from './dto/getcat.dto';
import { DeleteCatDto } from './dto/deleteCat.dto';

@Injectable()
export class ComponentCategoryService {
  constructor(private prisma: PrismaService) {}
  async GetAllCategories({ pageNo }: GetCatData) {
    try {
      const limit = 10;
      const queryOptions: any = {};

      if (pageNo) {
        queryOptions.skip = (parseInt(pageNo) - 1) * limit; // Calculate the offset
        queryOptions.take = limit; // Limit the number of records
      }

      const cats = await this.prisma.component_type.findMany(queryOptions);
      return { message: 'Success', data: cats };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async DeleteCategory({ id }: DeleteCatDto) {
    try {
      const comp = await this.prisma.component_type.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      // Check if the brand or its logo is missing
      if (!comp) {
        throw new BadRequestException(
          `Compoenent type with id ${id} does not exist.`,
        );
      }

      // Delete the brand from the database
      await this.prisma.component_type.delete({
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

  async createCategories(data: CreateCatDto) {
    try {
      const cat = await this.prisma.component_type.create({
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
