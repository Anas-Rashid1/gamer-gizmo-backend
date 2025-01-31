import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProcessor, CreateVariant } from './dto/createvariant.dto';
import { DeleteVariantsDto } from './dto/deleteVariantdto';
import { GetProcessorDto } from './dto/getmodels.dto';

@Injectable()
export class ProcessorService {
  constructor(private prisma: PrismaService) {}
  async GetAllVariants() {
    try {
      const variants = await this.prisma.processor_variant.findMany();
      return { message: 'Success', data: variants };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async CreateVariant(data: CreateVariant) {
    try {
      const variants = await this.prisma.processor_variant.create({
        data: {
          name: data.name,
        },
      });
      return { message: 'Success Craeted' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async DeleteProcessorVariant({ id }: DeleteVariantsDto) {
    try {
      const pro = await this.prisma.processor_variant.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      if (!pro) {
        throw new BadRequestException(`Variant with id ${id} does not exist.`);
      }

      await this.prisma.processor_variant.delete({
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
  async deleteProcessor({ id }: DeleteVariantsDto) {
    try {
      const pro = await this.prisma.processors.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      if (!pro) {
        throw new BadRequestException(
          `processor with id ${id} does not exist.`,
        );
      }

      await this.prisma.processors.delete({
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

  async GetAllProcessors(data: GetProcessorDto) {
    try {
      const processors = await this.prisma.processors.findMany({
        where: {
          variant_id: parseInt(data.variant),
        },
      });
      return { message: 'Success', data: processors };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async createProcessor(data: CreateProcessor) {
    try {
      const processor = await this.prisma.processors.create({
        data: {
          name: data.name,
          variant_id: data.variant_id,
        },
      });
      return { message: 'Successfully Created' };
    } catch (e) {
      console.log(e, 'pak');
      throw new InternalServerErrorException(e);
    }
  }
}
