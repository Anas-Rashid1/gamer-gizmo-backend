import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { CreateUserDto } from 'src/DataTransferObject/data.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class LoggingService {
  constructor(private readonly prismaService: PrismaService) {}

  async Signup(req: Request, res: Response) {
    try {
      const { email, username, password, firstName, lastName, isSeller } =
        req.body;

      console.log(req.body)

      // Check for missing fields
      if (
        !email ||
        !username ||
        !password ||
        !firstName ||
        !lastName ||
        isSeller === undefined
      ) {
        return res.status(400).json({ message: 'Incomplete Input Provided!' });
      }

      // Check if user already exists
      const doesUserExist = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (doesUserExist) {
        return res.status(409).json({ message: 'User Already Exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await this.prismaService.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          firstName,
          lastName,
          isSeller,
          //@ts-ignore
          isVerified: false, // Default to not verified
        },
      });

      return res
        .status(201)
        .json({ message: 'New User Created', user: newUser });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
