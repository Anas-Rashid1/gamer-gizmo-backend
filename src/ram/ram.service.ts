import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';

@Injectable()
export class RamService {
  constructor(private prisma: PrismaService) {}
  async GetAllRam() {
    try {
      const cat = await this.prisma.ram.findMany({})
      return { message: 'Success', data: cat };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async CreateRam(data: CreateRamDto) {
    try {
      const cat = await this.prisma.ram.create({
        data: { name: data.name },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async DeleteRam(data: DeleteDto) {
    try {
      const cat = await this.prisma.ram.create({
        data: { name: data.id },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
