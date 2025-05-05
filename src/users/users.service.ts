import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import * as fs from 'fs/promises';
import { join } from 'path';

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
  async getVerifiedByAdminUsers(pageNo) {
    try {
      const limit = 10;
      const queryOptions: any = {
        where: {
          is_admin_verified: true,
        },
      };

      if (pageNo) {
        queryOptions.skip = (parseInt(pageNo) - 1) * limit;
        queryOptions.take = limit;
      }
      const total = await this.prisma.users.count(queryOptions);
      const user = await this.prisma.users.findMany(queryOptions);
      return { message: 'Success', data: user, total };
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException(e);
    }
  }
  async getVerificationRequests(pageNo) {
    try {
      const limit = 10;
      const queryOptions: any = {
        where: {
          applied_for_verification: true,
          is_admin_verified: false,
        },
      };

      if (pageNo) {
        queryOptions.skip = (parseInt(pageNo) - 1) * limit;
        queryOptions.take = limit;
      }
      const total = await this.prisma.users.count(queryOptions);
      const user = await this.prisma.users.findMany(queryOptions);
      return { message: 'Success', data: user, total };
    } catch (e) {
      console.log(e);
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
  async approveUserVerification(id: any) {
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
          is_admin_verified: true,
        },
      });
      return { message: 'Success', data: user };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async rejectUserVerification(id: any) {
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
          is_admin_verified: false,
          applied_for_verification: false,
        },
      });
      return { message: 'Success', data: user };
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
    try {
      const existUser = await this.prisma.users.findUnique({
        where: { id: user.id },
      });

      // Only try to delete local file if it looks like a local path
      if (existUser.profile && existUser.profile.startsWith('public/')) {
        const localPath = join(__dirname, '..', '..', existUser.profile);
        try {
          await fs.unlink(localPath);
        } catch (err) {
          // If file not found, just warn and move on
          console.warn(
            `Failed to delete old profile image: ${localPath}`,
            err.message,
          );
        }
      }

      const updatedUser = await this.prisma.users.update({
        where: { id: user.id },
        data: {
          profile: `public/profilePics/${data.filename}`, // or full AWS URL if moved
        },
      });

      return { message: 'Successfully updated profile picture.' };
    } catch (e) {
      console.error('Error updating profile pic:', e);
      throw new InternalServerErrorException(
        'Something went wrong while updating the profile picture.',
      );
    }
  }
}
