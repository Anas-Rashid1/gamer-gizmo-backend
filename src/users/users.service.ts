// import {
//   BadRequestException,
//   Injectable,
//   InternalServerErrorException,
// } from '@nestjs/common';

// import { PrismaService } from 'src/prisma/prisma.service';
// import { UpdateUserDto } from './dto/updateUser.dto';
// import * as fs from 'fs/promises';
// import { join } from 'path';

// @Injectable()
// export class UserService {
//   constructor(private prisma: PrismaService) {}
//   async GetUserData(data) {
//     try {
//       const user = await this.prisma.users.findUnique({
//         where: {
//           id: data.id,
//         },
//         select: {
//           id: true,
//           username: true,
//           email: true,
//           first_name: true,
//           last_name: true,
//           is_email_verified: true,
//           is_seller: true,
//           created_at: true,
//           phone: true,
//           is_admin_verified: true,
//           dob: true,
//           gender: true,
//           address: true,
//           nic_front_image: true,
//           profile: true,
//           nic_back_image: true,
//           applied_for_verification: true,
//         },
//       });
//       return { message: 'Success', data: user };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async getVerifiedByAdminUsers(pageNo) {
//     try {
//       const limit = 10;
//       const queryOptions: any = {
//         where: {
//           is_admin_verified: true,
//         },
//       };

//       if (pageNo) {
//         queryOptions.skip = (parseInt(pageNo) - 1) * limit;
//         queryOptions.take = limit;
//       }
//       const total = await this.prisma.users.count(queryOptions);
//       const user = await this.prisma.users.findMany(queryOptions);
//       return { message: 'Success', data: user, total };
//     } catch (e) {
//       console.log(e);
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async getVerificationRequests(pageNo) {
//     try {
//       const limit = 10;
//       const queryOptions: any = {
//         where: {
//           applied_for_verification: true,
//           is_admin_verified: false,
//         },
//       };

//       if (pageNo) {
//         queryOptions.skip = (parseInt(pageNo) - 1) * limit;
//         queryOptions.take = limit;
//       }
//       const total = await this.prisma.users.count(queryOptions);
//       const user = await this.prisma.users.findMany(queryOptions);
//       return { message: 'Success', data: user, total };
//     } catch (e) {
//       console.log(e);
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async getAllUsers(pageNo) {
//     try {
//       const limit = 10;
//       const queryOptions: any = {
//         select: {
//           id: true,
//           username: true,
//           profile: true,
//           email: true,
//           first_name: true,
//           last_name: true,
//           is_email_verified: true,
//           is_seller: true,
//           created_at: true,
//           phone: true,
//           is_active: true,
//           is_admin_verified: true,
//           dob: true,
//           gender: true,
//           address: true,
//           applied_for_verification: true,
//         },
//       };

//       if (pageNo) {
//         queryOptions.skip = (parseInt(pageNo) - 1) * limit;
//         queryOptions.take = limit;
//       }
//       const total = await this.prisma.users.count();
//       const user = await this.prisma.users.findMany(queryOptions);
//       return { message: 'Success', data: user, total };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async approveUserVerification(id: any) {
//     try {
//       const user = await this.prisma.users.findUnique({
//         where: {
//           id: parseInt(id),
//         },
//       });
//       await this.prisma.users.update({
//         where: {
//           id: parseInt(id),
//         },
//         data: {
//           is_admin_verified: true,
//         },
//       });
//       return { message: 'Success', data: user };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async rejectUserVerification(id: any) {
//     try {
//       const user = await this.prisma.users.findUnique({
//         where: {
//           id: parseInt(id),
//         },
//       });
//       await this.prisma.users.update({
//         where: {
//           id: parseInt(id),
//         },
//         data: {
//           is_admin_verified: false,
//           applied_for_verification: false,
//         },
//       });
//       return { message: 'Success', data: user };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async updateUserData(data: any, dataToUpdate: UpdateUserDto) {
//     try {
//       const user = await this.prisma.users.update({
//         where: {
//           id: data.id,
//         },
//         data: dataToUpdate,
//       });
//       return { message: 'Success', data: user };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async deleteUser(id: any) {
//     try {
//       const user = await this.prisma.users.findUnique({
//         where: {
//           id: parseInt(id),
//         },
//       });
//       if (!user) {
//         throw new BadRequestException('No User Found');
//       }
//       await this.prisma.users.delete({
//         where: {
//           id: parseInt(id),
//         },
//       });
//       return { message: 'Success', data: user };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async changeUserStatus(id: any) {
//     try {
//       const user = await this.prisma.users.findUnique({
//         where: {
//           id: parseInt(id),
//         },
//       });
//       await this.prisma.users.update({
//         where: {
//           id: parseInt(id),
//         },
//         data: {
//           is_active: !Boolean(user.is_active),
//         },
//       });
//       return { message: 'Success', data: user };
//     } catch (e) {
//       throw new InternalServerErrorException(e);
//     }
//   }

//   async ApplyForVerification(data, user) {
//     console.log(data, user);
//     try {
//       const updatedUser = await this.prisma.users.update({
//         where: {
//           id: user.id,
//         },
//         data: {
//           nic_front_image: `/public/nic/${data.nicFrontImage.filename}`,
//           nic_back_image: `/public/nic/${data.nicBackImage.filename}`,
//           applied_for_verification: true,
//         },
//       });
//       return { message: 'Successfully Created' };
//     } catch (e) {
//       console.log(e);
//       throw new InternalServerErrorException(e);
//     }
//   }
//   async UpdateProfilePic(data, user) {
//     try {
//       const existUser = await this.prisma.users.findUnique({
//         where: { id: user.id },
//       });

//       // Only try to delete local file if it looks like a local path
//       if (existUser.profile && existUser.profile.startsWith('public/')) {
//         const localPath = join(__dirname, '..', '..', existUser.profile);
//         try {
//           await fs.unlink(localPath);
//         } catch (err) {
//           // If file not found, just warn and move on
//           console.warn(
//             `Failed to delete old profile image: ${localPath}`,
//             err.message,
//           );
//         }
//       }

//       const updatedUser = await this.prisma.users.update({
//         where: { id: user.id },
//         data: {
//           profile: `public/profilePics/${data.filename}`, // or full AWS URL if moved
//         },
//       });

//       return { message: 'Successfully updated profile picture.' };
//     } catch (e) {
//       console.error('Error updating profile pic:', e);
//       throw new InternalServerErrorException(
//         'Something went wrong while updating the profile picture.',
//       );
//     }
//   }
// }


import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/updateUser.dto';
import { S3Service } from 'src/utils/s3.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async GetUserData(data) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: data.id },
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

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const profileUrl = user.profile
        ? await this.s3Service.get_image_url(user.profile)
        : null;
      const nicFrontUrl = user.nic_front_image
        ? await this.s3Service.get_image_url(user.nic_front_image)
        : null;
      const nicBackUrl = user.nic_back_image
        ? await this.s3Service.get_image_url(user.nic_back_image)
        : null;

      return {
        message: 'Success',
        data: {
          ...user,
          profile: profileUrl,
          nic_front_image: nicFrontUrl,
          nic_back_image: nicBackUrl,
        },
      };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async getAllUsers(pageNo: any) {
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
      const users = await this.prisma.users.findMany(queryOptions);

      const enriched = await Promise.all(
        users.map(async (user) => {
          const profileUrl = user.profile
            ? await this.s3Service.get_image_url(user.profile)
            : null;
          const nicFrontUrl = user.nic_front_image
            ? await this.s3Service.get_image_url(user.nic_front_image)
            : null;
          const nicBackUrl = user.nic_back_image
            ? await this.s3Service.get_image_url(user.nic_back_image)
            : null;
          return {
            ...user,
            profile: profileUrl,
            nic_front_image: nicFrontUrl,
            nic_back_image: nicBackUrl,
          };
        }),
      );

      return { message: 'Success', data: enriched, total };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async getVerifiedByAdminUsers(pageNo: any) {
    try {
      const limit = 10;
      const queryOptions: any = {
        where: { is_admin_verified: true },
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

      const total = await this.prisma.users.count({ where: { is_admin_verified: true } });
      const users = await this.prisma.users.findMany(queryOptions);

      const enriched = await Promise.all(
        users.map(async (user) => {
          const profileUrl = user.profile
            ? await this.s3Service.get_image_url(user.profile)
            : null;
          const nicFrontUrl = user.nic_front_image
            ? await this.s3Service.get_image_url(user.nic_front_image)
            : null;
          const nicBackUrl = user.nic_back_image
            ? await this.s3Service.get_image_url(user.nic_back_image)
            : null;
          return {
            ...user,
            profile: profileUrl,
            nic_front_image: nicFrontUrl,
            nic_back_image: nicBackUrl,
          };
        }),
      );

      return { message: 'Success', data: enriched, total };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async getVerificationRequests(pageNo: any) {
    try {
      const limit = 10;
      const queryOptions: any = {
        where: {
          applied_for_verification: true,
          is_admin_verified: false,
        },
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
          nic_front_image :true,
          nic_back_image :true
        },
      };

      if (pageNo) {
        queryOptions.skip = (parseInt(pageNo) - 1) * limit;
        queryOptions.take = limit;
      }

      const total = await this.prisma.users.count({
        where: { applied_for_verification: true, is_admin_verified: false },
      });
      const users = await this.prisma.users.findMany(queryOptions);

      const enriched = await Promise.all(
        users.map(async (user) => {
          const profileUrl = user.profile
            ? await this.s3Service.get_image_url(user.profile)
            : null;
          const nicFrontUrl = user.nic_front_image
            ? await this.s3Service.get_image_url(user.nic_front_image)
            : null;
          const nicBackUrl = user.nic_back_image
            ? await this.s3Service.get_image_url(user.nic_back_image)
            : null;
          return {
            ...user,
            profile: profileUrl,
            nic_front_image: nicFrontUrl,
            nic_back_image: nicBackUrl,
          };
        }),
      );

      return { message: 'Success', data: enriched, total };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async approveUserVerification(id: any) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      await this.prisma.users.update({
        where: { id: parseInt(id) },
        data: { is_admin_verified: true },
      });

      return { message: 'Success', data: user };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async rejectUserVerification(id: any) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Delete NIC images from S3
      if (user.nic_front_image) {
        await this.s3Service.deleteFileByKey(user.nic_front_image);
      }
      if (user.nic_back_image) {
        await this.s3Service.deleteFileByKey(user.nic_back_image);
      }

      await this.prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          is_admin_verified: false,
          applied_for_verification: false,
          nic_front_image: null,
          nic_back_image: null,
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
        where: { id: data.id },
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
        where: { id: parseInt(id) },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Delete associated S3 files
      if (user.profile) {
        await this.s3Service.deleteFileByKey(user.profile);
      }
      if (user.nic_front_image) {
        await this.s3Service.deleteFileByKey(user.nic_front_image);
      }
      if (user.nic_back_image) {
        await this.s3Service.deleteFileByKey(user.nic_back_image);
      }

      await this.prisma.users.delete({
        where: { id: parseInt(id) },
      });

      return { message: 'Success', data: user };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async changeUserStatus(id: any) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      await this.prisma.users.update({
        where: { id: parseInt(id) },
        data: { is_active: !Boolean(user.is_active) },
      });

      return { message: 'Success', data: user };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async ApplyForVerification(data: { nicFrontImage: Express.Multer.File; nicBackImage: Express.Multer.File }, user: any) {
    try {
      if (!data.nicFrontImage || !data.nicBackImage) {
        throw new BadRequestException('Both NIC front and back images are required');
      }

      const nicFrontUploaded = await this.s3Service.upload_file(data.nicFrontImage);
      const nicBackUploaded = await this.s3Service.upload_file(data.nicBackImage);

      const updatedUser = await this.prisma.users.update({
        where: { id: user.id },
        data: {
          nic_front_image: nicFrontUploaded.Key,
          nic_back_image: nicBackUploaded.Key,
          applied_for_verification: true,
        },
      });

      return { message: 'Successfully applied for verification' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async UpdateProfilePic(profile: Express.Multer.File, user: any) {
    try {
      const existUser = await this.prisma.users.findUnique({
        where: { id: user.id },
      });

      if (!existUser) {
        throw new BadRequestException('User not found');
      }

      // Delete old profile picture from S3 if it exists
      if (existUser.profile) {
        await this.s3Service.deleteFileByKey(existUser.profile);
      }

      const uploaded = await this.s3Service.upload_file(profile);

      const updatedUser = await this.prisma.users.update({
        where: { id: user.id },
        data: { profile: uploaded.Key },
      });

      return { message: 'Successfully updated profile picture' };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async deleteOwnAccount(userId: number) {
  try {
    // Fetch user to check existence and get S3 keys and details
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profile: true,
        nic_front_image: true,
        nic_back_image: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        address: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Perform all deletions in a transaction with increased timeout
    await this.prisma.$transaction(async (tx) => {
      // Handle tables with onDelete: NoAction referencing users
      // 1. messages (delete messages in chats where user is user1_id or user2_id, and sent by user)
      await tx.messages.deleteMany({
        where: {
          OR: [
            { chats: { user1_id: userId } },
            { chats: { user2_id: userId } },
            { sender_id: userId },
          ],
        },
      });

      // 2. chats (delete where user is user1_id or user2_id)
      await tx.chats.deleteMany({
        where: {
          OR: [
            { user1_id: userId },
            { user2_id: userId },
          ],
        },
      });

      // 3. community_chat_members (delete memberships)
      await tx.community_chat_members.deleteMany({
        where: { user_id: userId },
      });

      // 4. community_chat_messages (delete messages)
      await tx.community_chat_messages.deleteMany({
        where: { user_id: userId },
      });

      // 5. user_reviews (delete reviews given or received)
      await tx.user_reviews.deleteMany({
        where: {
          OR: [
            { reviewer_id: userId },
            { reviewee_id: userId },
          ],
        },
      });

      // Handle tables with onDelete: NoAction referencing product
      // 6. cart_items (delete items referencing user's products)
      await tx.cart_items.deleteMany({
        where: {
          product: { user_id: userId },
        },
      });

      // 7. components (delete components of user's products)
      await tx.components.deleteMany({
        where: {
          product: { user_id: userId },
        },
      });

      // 8. order_items (set product_id to null and store product details in product_details)
      const orderItems = await tx.order_items.findMany({
        where: {
          product: { user_id: userId },
        },
        include: {
          product: {
            include: {
              categories: true,
              brands: true,
            },
          },
        },
      });

      // Update each order_item individually to store correct product details
      for (const item of orderItems) {
        const productDetails = {
          product_id: item.product_id,
          name: item.product?.name,
          description: item.product?.description,
          price: item.product?.price,
          stock: item.product?.stock,
          quantity: item.quantity,
          category: item.product?.categories?.name,
          brand: item.product?.brands?.name,
          created_at: item.product?.created_at?.toISOString(),
        };

        await tx.order_items.update({
          where: { id: item.id },
          data: {
            product_id: null,
            product_details: productDetails,
          },
        });
      }

      // 9. orders (set user_id to null, store user details in user_details)
      const userDetails = {
        user_id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        address: user.address,
      };

      await tx.orders.updateMany({
        where: { user_id: userId },
        data: {
          user_id: null,
          user_details: userDetails,
        },
      });

      // Delete user (cascades to cart, favourite_products, tokens, product, product_reviews, community_messages, message_reactions)
      await tx.users.delete({
        where: { id: userId },
      });
    }, {
      timeout: 20000, 
    });

    // Delete S3 files outside the transaction
    if (user.profile) {
      await this.s3Service.deleteFileByKey(user.profile);
    }
    if (user.nic_front_image) {
      await this.s3Service.deleteFileByKey(user.nic_front_image);
    }
    if (user.nic_back_image) {
      await this.s3Service.deleteFileByKey(user.nic_back_image);
    }

    return { message: 'Account deleted successfully' };
  } catch (e) {
    if (e instanceof BadRequestException) {
      throw e;
    }
    throw new InternalServerErrorException('Failed to delete account: ' + e.message);
  }
}
}