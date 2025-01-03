import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dtos/login-user.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('getUser')
  async getUser() {
    return this.authService.getUser();
  }
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }
  @Post('signin')
  async signin(@Body() loginUserDto: LoginUserDto) {
    return this.authService.signin(loginUserDto);
  }
  @Post('verifyOtp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }
}
