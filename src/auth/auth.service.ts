import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async signup(createUserDto: CreateUserDto): Promise<string> {
    const {
      email,
      password,
      firstName,
      lastName,
      confirmPassword,
      phone,
      username,
    } = createUserDto;
    console.log(this.prisma.user.findMany());
    return 'hello';
  }
}
