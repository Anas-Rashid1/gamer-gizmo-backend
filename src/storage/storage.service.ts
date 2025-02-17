import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRamDto } from './dto/ram.dto';
import { DeleteDto } from './dto/delete.dto';

@Injectable()
export class StorageService {
  constructor(private prisma: PrismaService) {}
  async GetStorage() {
    try {
      const cat = await this.prisma.storage.findMany({})
      return { message: 'Success', data: cat };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async CreateStorage(data: CreateRamDto) {
    try {
      const cat = await this.prisma.storage.create({
        data: { name: data.name },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async DeleteStorage(data: DeleteDto) {
    try {
      const cat = await this.prisma.storage.delete({
        where: { id: parseInt(data.id) },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async GetStorageType() {
    try {
      const cat = await this.prisma.storage_type.findMany({})
      return { message: 'Success', data: cat };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async CreateStorageType(data: CreateRamDto) {
    try {
      const cat = await this.prisma.storage_type.create({
        data: { name: data.name },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async DeleteStorageType(data: DeleteDto) {
    try {
      const cat = await this.prisma.storage_type.delete({
        where: { id: parseInt(data.id) },
      });
      return { message: 'Success Created' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
