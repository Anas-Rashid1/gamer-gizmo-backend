import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoriesDto } from './dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}
  async GetAllCategories() {
    try {
      const cat = await this.prisma.categories.findMany({});
      return { message: 'Success', data: cat };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async createCategory(data: CreateCategoriesDto) {
    try {
      const cat = await this.prisma.categories.create({
        data: { name: data.name },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async deleteCategory(data: CreateCategoriesDto) {
    try {
      const cat = await this.prisma.categories.create({
        data: { name: data.name },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
