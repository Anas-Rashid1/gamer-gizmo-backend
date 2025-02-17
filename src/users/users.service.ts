import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import * as fs from 'fs/promises';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async GetUserData(data) {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          id: data.id,
        },
        select: {
          id: true,
          username: true,
          email: true,
          first_name: true,
          last_name: true,
          is_email_verified: true,
          is_seller: true,
          created_at: true,
          phone: true,
          is_admin_verified: true,
          dob: true,
          gender: true,
          address: true,
          nic_front_image: true,
          profile: true,
          nic_back_image: true,
          applied_for_verification: true,
        },
      });
      return { message: 'Success', data: user };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async getAllUsers(pageNo) {
    try {
      const limit = 10;
      const queryOptions: any = {
        select: {
          id: true,
          username: true,
          profile: true,
          email: true,
          first_name: true,
          last_name: true,
          is_email_verified: true,
          is_seller: true,
          created_at: true,
          phone: true,
          is_active: true,
          is_admin_verified: true,
          dob: true,
          gender: true,
          address: true,
          applied_for_verification: true,
        },
      };

      if (pageNo) {
        queryOptions.skip = (parseInt(pageNo) - 1) * limit;
        queryOptions.take = limit;
      }
      const total = await this.prisma.users.count();
      const user = await this.prisma.users.findMany(queryOptions);
      return { message: 'Success', data: user, total };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async updateUserData(data: any, dataToUpdate: UpdateUserDto) {
    try {
      const user = await this.prisma.users.update({
        where: {
          id: data.id,
        },
        data: dataToUpdate,
      });
      return { message: 'Success', data: user };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async deleteUser(id: any) {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      if (!user) {
        throw new BadRequestException('No User Found');
      }
      await this.prisma.users.delete({
        where: {
          id: parseInt(id),
        },
      });
      return { message: 'Success', data: user };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async changeUserStatus(id: any) {
    try {
      const user = await this.prisma.users.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      await this.prisma.users.update({
        where: {
          id: parseInt(id),
        },
        data: {
          is_active: !Boolean(user.is_active),
        },
      });
      return { message: 'Success', data: user };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async ApplyForVerification(data, user) {
    console.log(data, user);
    try {
      const updatedUser = await this.prisma.users.update({
        where: {
          id: user.id,
        },
        data: {
          nic_front_image: `/public/nic/${data.nicFrontImage.filename}`,
          nic_back_image: `/public/nic/${data.nicBackImage.filename}`,
          applied_for_verification: true,
        },
      });
      return { message: 'Successfully Created' };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }
  async UpdateProfilePic(data, user) {
    console.log(data, user);
    try {
      const existUser = await this.prisma.users.findUnique({
        where: {
          id: user.id,
        },
      });
      console.log(existUser, data);
      if (existUser.profile != null) {
        await fs.unlink(existUser.profile);
      }
      const updatedUser = await this.prisma.users.update({
        where: {
          id: user.id,
        },
        data: {
          profile: `public/profilePics/${data.filename}`,
        },
      });
      return { message: 'Successfully Created' };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }
}
