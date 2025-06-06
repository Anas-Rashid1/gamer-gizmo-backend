import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAdminDto, CreateUserDto } from './dtos/create-user.dto';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { LoginAdminDto, LoginUserDto } from './dtos/login-user.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';
import { LogoutUserDto } from './dtos/logout-user.dto';
import { ForgetPassDto } from './dtos/forgetPass.dto';
import { SendPassOtpDto } from './dtos/send-pass-otp.dto';
import { AuthGuard } from './auth.gurad';
import { GoogleSignInDto } from './dtos/google-signin.dto';
import { FacebookSignInDto } from './dtos/facebook-signin.dto'; 
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('signup')
  // async signup(@Body() createUserDto: CreateUserDto) {
  //   return this.authService.signup(createUserDto);
  // }

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    console.log('Signup endpoint hit');
    return this.authService.signup(createUserDto);
  }
  @Post('admin/signup')
  async Adminsignup(@Body() createAdmin: CreateAdminDto) {
    return this.authService.Adminsignup(createAdmin);
  }
  @Post('admin/signin')
  async AdminSignin(@Body() loginAdminDto: LoginAdminDto) {
    return this.authService.AdminSignin(loginAdminDto);
  }
  @Post('signin')
  async signin(@Body() loginUserDto: LoginUserDto) {
    return this.authService.signin(loginUserDto);
  }
  @Post('verifyOtp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }
  @Post('logoutOtherAccounts')
  async logoutOtherAccounts(@Body() logoutDto: LogoutUserDto) {
    return this.authService.logoutOtherAccounts(logoutDto);
  }
  // @ApiBearerAuth()
  // @UseGuards(AuthGuard)
  @Post('logoutUser')
  async logoutUser(@Body() logoutDto: LogoutUserDto) {
    return this.authService.logoutUser(logoutDto);
  }
  @Get('email/logoutConfirmation')
  async emailLogoutConfirmation(@Query('token') token: string) {
    return this.authService.emailLogoutConfirmation(token);
  }
  @Post('sendForgetPasswordOtp')
  async sendForgetPasswordOtp(@Body() sendPassOtp: SendPassOtpDto) {
    return this.authService.sendForgetPasswordOtp(sendPassOtp);
  }
  @Post('resetPasswordOtp')
  async resetPasswordOtp(@Body() forgetPassDto: ForgetPassDto) {
    return this.authService.updatePassword(forgetPassDto);
  }
  @Post('google-signin')
  async googleSignIn(@Body() googleSignInDto: GoogleSignInDto) {
    return this.authService.googleSignIn(googleSignInDto);
  }

  @Post('facebook-signin')
  async facebookSignIn(@Body() facebookSignInDto: FacebookSignInDto) {
    return this.authService.facebookSignIn(facebookSignInDto);
  }
}
