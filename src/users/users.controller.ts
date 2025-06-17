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
  ApiBearerAuth,ApiOperation,
  ApiResponse,
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

    @Delete('/deleteOwnAccount')
  @ApiOperation({ summary: 'Delete the authenticated user’s account' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Account deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - User not found or cannot delete due to active transactions' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiResponse({ status: 500, description: 'Internal Server Error - Failed to delete account' })
  async deleteOwnAccount(@Req() request: any) {
    return this.userService.deleteOwnAccount(request.user.id);
  }
  @Post('/facebook/deletion-callback')
  @ApiOperation({ summary: 'Handle Facebook data deletion requests' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        signed_request: { type: 'string', description: 'Facebook signed request' },
      },
      required: ['signed_request'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion request received',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://backend.gamergizmo.com/deletion-status' },
        confirmation_code: { type: 'string', example: 'abc123' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid signed request' })
  async handleFacebookDeletion(@Body() body: { signed_request: string }) {
    return this.userService.handleFacebookDeletion(body.signed_request);
  }

  @Get('/facebook/deletion-status')
  @ApiOperation({ summary: 'Check Facebook data deletion status' })
  @ApiQuery({
    name: 'confirmation_code',
    required: true,
    type: String,
    description: 'Confirmation code from deletion request',
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion status retrieved',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'COMPLETED' },
        message: { type: 'string', example: 'Deletion request processed' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid confirmation code' })
  async checkDeletionStatus(@Query('confirmation_code') confirmationCode: string) {
    return this.userService.checkDeletionStatus(confirmationCode);
  }
}