// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Post,
//   Put,
//   Query,
//   Req,
//   UploadedFile,
//   UploadedFiles,
//   UseGuards,
//   UseInterceptors,
// } from '@nestjs/common';
// import { UserService } from './users.service';
// import {
//   ApiBearerAuth,
//   ApiBody,
//   ApiConsumes,
//   ApiTags,
//   ApiQuery,
// } from '@nestjs/swagger';
// import { AuthGuard } from 'src/auth/auth.gurad';
// import { UpdateUserDto } from './dto/updateUser.dto';
// import {
//   FileFieldsInterceptor,
//   FileInterceptor,
// } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { extname } from 'path';
// import { GetBrandsDto } from './dto/getbrands.dto';
// import { DeleteBrandsDto } from './dto/deletebrands.dto';
// import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';
// import { getAllUsersDto } from './dto/getUsersDto';

// @ApiTags('Users')
// @Controller('/user')
// export class UserContoller {
//   constructor(private readonly userService: UserService) {}
//   @ApiBearerAuth()
//   @UseGuards(AuthGuard)
//   @Get('/getUserData')
//   async GetUserData(@Req() data: any) {
//     return this.userService.GetUserData(data.user);
//   }

//   // @ApiBearerAuth()
//   // @UseGuards(AdminAuthGuard)
//   @Get('/getAllUsers')
//   @ApiQuery({
//     name: 'pageNo',
//     required: false, // Make pageNo optional
//     type: Number,
//     description:
//       'Page number for pagination (if not provided, all brands will be returned)',
//   })
//   @ApiBearerAuth()
//   @UseGuards(AdminAuthGuard)
//   async getAllUsers(@Query() { pageNo = null }: getAllUsersDto) {
//     return this.userService.getAllUsers(pageNo);
//   }

//   @Get('/getVerifiedByAdminUsers')
//   @ApiQuery({
//     name: 'pageNo',
//     required: false, // Make pageNo optional
//     type: Number,
//     description:
//       'Page number for pagination (if not provided, all brands will be returned)',
//   })
//   @ApiBearerAuth()
//   @UseGuards(AdminAuthGuard)
//   async getVerifiedByAdminUsers(@Query() { pageNo = null }: getAllUsersDto) {
//     return this.userService.getVerifiedByAdminUsers(pageNo);
//   }
//   @Get('/getVerificationRequests')
//   @ApiQuery({
//     name: 'pageNo',
//     required: false, // Make pageNo optional
//     type: Number,
//     description:
//       'Page number for pagination (if not provided, all brands will be returned)',
//   })
//   @ApiBearerAuth()
//   @UseGuards(AdminAuthGuard)
//   async getVerificationRequests(@Query() { pageNo = null }: getAllUsersDto) {
//     return this.userService.getVerificationRequests(pageNo);
//   }

//   @Get('/changeUserStatus')
//   @ApiQuery({
//     name: 'userId',
//     required: false, // Make pageNo optional
//     type: Number,
//   })
//   @ApiBearerAuth()
//   @UseGuards(AdminAuthGuard)
//   async changeUserStatus(@Query() { userId }: { userId: any }) {
//     return this.userService.changeUserStatus(userId);
//   }
//   @Get('/approveUserVerification')
//   @ApiQuery({
//     name: 'userId',
//     required: false, // Make pageNo optional
//     type: Number,
//   })
//   @ApiBearerAuth()
//   @UseGuards(AdminAuthGuard)
//   async approveUserVerification(@Query() { userId }: { userId: any }) {
//     return this.userService.approveUserVerification(userId);
//   }
//   @Get('/rejectUserVerification')
//   @ApiQuery({
//     name: 'userId',
//     required: false, // Make pageNo optional
//     type: Number,
//   })
//   @ApiBearerAuth()
//   @UseGuards(AdminAuthGuard)
//   async rejectUserVerification(@Query() { userId }: { userId: any }) {
//     return this.userService.rejectUserVerification(userId);
//   }

//   @Delete('/deleteUser')
//   @ApiQuery({
//     name: 'userId',
//     required: false, // Make pageNo optional
//     type: Number,
//   })
//   @ApiBearerAuth()
//   @UseGuards(AdminAuthGuard)
//   async deleteUser(@Query() { userId }: { userId: any }) {
//     return this.userService.deleteUser(userId);
//   }

//   @ApiBearerAuth()
//   @UseGuards(AuthGuard)
//   @Post('/updateUserData')
//   async UpdateUserData(@Req() data: any, @Body() dataToUpdate: UpdateUserDto) {
//     return this.userService.updateUserData(data.user, dataToUpdate);
//   }
//   @UseInterceptors(
//     FileFieldsInterceptor(
//       [
//         { name: 'nic_front_image', maxCount: 1 },
//         { name: 'nic_back_image', maxCount: 1 },
//       ],
//       {
//         storage: diskStorage({
//           destination: './public/nic',
//           filename: (req, file, cb) => {
//             const uniqueSuffix =
//               Date.now() + '-' + Math.round(Math.random() * 1e9);
//             const ext = extname(file.originalname);
//             const fileName = `nic-${file.fieldname}-${uniqueSuffix}${ext}`;
//             cb(null, fileName);
//           },
//         }),
//       },
//     ),
//   )
//   @ApiBearerAuth()
//   @UseGuards(AuthGuard)
//   @ApiConsumes('multipart/form-data')
//   @ApiBody({
//     description: 'Upload NIC front and back images',
//     required: true,
//     schema: {
//       type: 'object',
//       properties: {
//         nic_front_image: {
//           type: 'string',
//           format: 'binary',
//           description: 'NIC front image file',
//         },
//         nic_back_image: {
//           type: 'string',
//           format: 'binary',
//           description: 'NIC back image file',
//         },
//       },
//     },
//   })
//   @Post('/applyForVerification')
//   async ApplyForVerification(
//     @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
//     @Req() user: any,
//   ) {
//     const nicFrontImage = files.nic_front_image?.[0];
//     const nicBackImage = files.nic_back_image?.[0];

//     return this.userService.ApplyForVerification(
//       {
//         nicFrontImage,
//         nicBackImage,
//       },
//       user.user,
//     );
//   }

//   @UseInterceptors(
//     FileInterceptor('profile', {
//       storage: diskStorage({
//         destination: function (req, file, cb) {
//           cb(null, './public/profilePics');
//         },
//         filename: (req, file, cb) => {
//           const uniqueSuffix =
//             Date.now() + '-' + Math.round(Math.random() * 1e9);
//           const ext = extname(file.originalname); // Extract the file extension
//           const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
//           cb(null, fileName);
//         },
//       }),
//     }),
//   )
//   @ApiBearerAuth()
//   @UseGuards(AuthGuard)
//   @ApiConsumes('multipart/form-data')
//   @ApiBody({
//     description: 'Upload NIC front and back images',
//     required: true,
//     schema: {
//       type: 'object',
//       properties: {
//         profile: {
//           type: 'string',
//           format: 'binary',
//           description: 'NIC front image file',
//         },
//       },
//     },
//   })
//   @Post('/updateProfilePicture')
//   async UpdateProfilePic(
//     @UploadedFile() profile: Express.Multer.File,
//     @Req() user: any,
//   ) {
//     return this.userService.UpdateProfilePic(profile, user.user);
//   }
// }

import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './users.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.gurad';
import { UpdateUserDto } from './dto/updateUser.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { AdminAuthGuard } from 'src/auth/admin.auth.gurad';
import { getAllUsersDto } from './dto/getUsersDto';

@ApiTags('Users')
@Controller('/user')
export class UserContoller {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('/getUserData')
  async GetUserData(@Req() data: any) {
    return this.userService.GetUserData(data.user);
  }

  @Get('/getAllUsers')
  @ApiQuery({
    name: 'pageNo',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  async getAllUsers(@Query() { pageNo = null }: getAllUsersDto) {
    return this.userService.getAllUsers(pageNo);
  }

  @Get('/getVerifiedByAdminUsers')
  @ApiQuery({
    name: 'pageNo',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  async getVerifiedByAdminUsers(@Query() { pageNo = null }: getAllUsersDto) {
    return this.userService.getVerifiedByAdminUsers(pageNo);
  }

  @Get('/getVerificationRequests')
  @ApiQuery({
    name: 'pageNo',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  async getVerificationRequests(@Query() { pageNo = null }: getAllUsersDto) {
    return this.userService.getVerificationRequests(pageNo);
  }

  @Get('/changeUserStatus')
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
  })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  async changeUserStatus(@Query() { userId }: { userId: any }) {
    return this.userService.changeUserStatus(userId);
  }

  @Get('/approveUserVerification')
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
  })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  async approveUserVerification(@Query() { userId }: { userId: any }) {
    return this.userService.approveUserVerification(userId);
  }

  @Get('/rejectUserVerification')
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
  })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  async rejectUserVerification(@Query() { userId }: { userId: any }) {
    return this.userService.rejectUserVerification(userId);
  }

  @Delete('/deleteUser')
  @ApiQuery({
    name: 'userId',
    required: true,
    type: Number,
  })
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  async deleteUser(@Query() { userId }: { userId: any }) {
    return this.userService.deleteUser(userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('/updateUserData')
  async UpdateUserData(@Req() data: any, @Body() dataToUpdate: UpdateUserDto) {
    return this.userService.updateUserData(data.user, dataToUpdate);
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'nic_front_image', maxCount: 1 },
      { name: 'nic_back_image', maxCount: 1 },
    ]),
  )
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload NIC front and back images',
    required: true,
    schema: {
      type: 'object',
      properties: {
        nic_front_image: {
          type: 'string',
          format: 'binary',
          description: 'NIC front image file',
        },
        nic_back_image: {
          type: 'string',
          format: 'binary',
          description: 'NIC back image file',
        },
      },
    },
  })
  @Post('/applyForVerification')
  async ApplyForVerification(
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
    @Req() user: any,
  ) {
    const nicFrontImage = files.nic_front_image?.[0];
    const nicBackImage = files.nic_back_image?.[0];
    return this.userService.ApplyForVerification(
      { nicFrontImage, nicBackImage },
      user.user,
    );
  }

  @UseInterceptors(FileInterceptor('profile'))
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload profile picture',
    required: true,
    schema: {
      type: 'object',
      properties: {
        profile: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file',
        },
      },
    },
  })
  @Post('/updateProfilePicture')
  async UpdateProfilePic(
    @UploadedFile() profile: Express.Multer.File,
    @Req() user: any,
  ) {
    return this.userService.UpdateProfilePic(profile, user.user);
  }
}