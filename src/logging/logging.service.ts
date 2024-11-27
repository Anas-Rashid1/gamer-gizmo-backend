import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggingService {
  SignIn(req: Request, res: Response) {
    const { name } = req.body;

    res.status(201).json({ done: name });
  }
}
