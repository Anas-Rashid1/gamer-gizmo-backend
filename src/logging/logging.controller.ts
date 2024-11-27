import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from './logging.service';

@Controller('auth')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Post('/signin')
  SignIn(@Req() req: Request, @Res() res: Response): any {
    return this.loggingService.SignIn(req, res);
  }
  @Get('/signup')
  SignUp(): number {
    return 13;
  }
}
