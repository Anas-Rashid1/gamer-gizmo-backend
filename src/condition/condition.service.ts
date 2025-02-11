import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';

@Injectable()
export class ConditionService {
  constructor(private prisma: PrismaService) {}
  async GetAllCondition() {
    try {
      const cat = await this.prisma.condition.findMany({})
      return { message: 'Success', data: cat };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async CreateCondition(data: CreateRamDto) {
    try {
      const cat = await this.prisma.condition.create({
        data: { name: data.name },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async DeleteCondition(data: DeleteDto) {
    try {
      const cat = await this.prisma.condition.delete({
        where: { id: parseInt(data.id) },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
