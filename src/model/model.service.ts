import {
  BadRequestException,
  Injectable,
  
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {  CreateModelsto } from './dto/createmodel.dto';
import {  GetModlesDto } from './dto/getmodels.dto';
import {  DeleteModelsDto } from './dto/deletemodel.dto';

@Injectable()
export class ModelService {
  constructor(private prisma: PrismaService) {}
  async GetAllModels({ brand, pageNo }: GetModlesDto) {
    try {
      const limit = 10;

      const whereCondition = brand
        ? { brand_id: parseInt(brand) }
        : {}; 
      const queryOptions: any = {
        where: whereCondition,
      };

      if (pageNo) {
        queryOptions.skip = (parseInt(pageNo) - 1) * limit; // Calculate the offset
        queryOptions.take = limit; // Limit the number of records
      }

      const models = await this.prisma.models.findMany(queryOptions);
      return { message: 'Success', data: models };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async DeleteModel({ id }: DeleteModelsDto) {
    try {
      const model = await this.prisma.models.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      // Check if the brand or its logo is missing
      if (!model) {
        throw new BadRequestException(`Brand with id ${id} does not exist.`);
      }
    

      // Delete the brand from the database
      await this.prisma.models.delete({
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

  async createModel(data: CreateModelsto,) {
    try {      
      const brands = await this.prisma.models.create({
        data: {
          name: data.name,
          brand_id: parseInt(data.brand_id),
          status: true,
        },
      });
      return { message: 'Successfully Created' };
    } catch (e) {
      console.log(e,"pak")
      throw new InternalServerErrorException(e);
    }
  }
}
