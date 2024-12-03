import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from './logging.service';

@Controller('auth')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Post('/signup')
  SignUp(@Req() req: Request, @Res() res: Response): any {
    return this.loggingService.Signup(req, res);
  }
}
