import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';

@Injectable()
export class GPUService {
  constructor(private prisma: PrismaService) {}
  async GetAllGPU() {
    try {
      const cat = await this.prisma.gpu.findMany({})
      return { message: 'Success', data: cat };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async CreateGPU(data: CreateRamDto) {
    try {
      const cat = await this.prisma.gpu.create({
        data: { name: data.name },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async DeleteGPU(data: DeleteDto) {
    try {
      const cat = await this.prisma.gpu.create({
        data: { name: data.id },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
