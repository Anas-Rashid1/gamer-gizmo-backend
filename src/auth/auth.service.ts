import {
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateOTP } from 'src/utils/otp.generator';
import { RedisConnector } from 'src/redis/database.connector';
import { JwtService } from '@nestjs/jwt';
import * as ejs from 'ejs';
import {
  Transporter as NmTransporter,
  createTransport,
  TransportOptions,
} from 'nodemailer';
import { otpTemplate } from 'src/views/otp.template';
import { LoginUserDto } from './dtos/login-user.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  async signup(createUserDto: CreateUserDto) {
    const {
      email,
      password,
      firstName,
      lastName,
      confirmPassword,
      phone,
      username,
    } = createUserDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const doesUserExist = await this.prisma.users.findUnique({
      where: { email: email },
    });
    const isUsernameAvailable = await this.prisma.users.findUnique({
      where: { username: username },
    });

    if (doesUserExist) {
      throw new BadRequestException('Email already in use');
    }
    if (isUsernameAvailable) {
      throw new BadRequestException('Username already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      await this.authenticateByOtp(email);
    } catch (err) {
      throw new BadRequestException(
        'Failed to send OTP email. Rolling back user creation.',
      );
    }
    const newUser = await this.prisma.users.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        username,
        password: hashedPassword,
        email,
        phone,
        is_seller: false,
        is_verified: false,
      },
    });
    if (!newUser) {
      throw new BadRequestException(['Could not create user!']);
    }
    const otp_res = await this.authenticateByOtp(email);
    const { password: _, ...userWithoutPassword } = newUser;
    return {
      message: 'Successs',
      data: { user: userWithoutPassword, otp: otp_res },
    };
  }
  async signin(createUserDto: LoginUserDto) {
    const { name, password, platform } = createUserDto;

    let user = await this.prisma.users.findUnique({
      where: { email: name },
    });
    if (!user) {
      user = await this.prisma.users.findUnique({
        where: { username: name },
      });
    }

    if (!user) {
      throw new BadRequestException('No User Found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect email or password');
    }
    const isUserVerified = user.is_verified;
    if (!isUserVerified) {
      await this.authenticateByOtp(user.email);
      throw new BadRequestException(
        'User is not Verified, Email is sent to the registerd email',
      );
    }
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };
    // let user_tokens = await this.prisma.tokens.findUnique({
    //   where: { email: name },
    // });
    const token = await this.jwtService.signAsync(payload);
    if (!token) {
      throw new BadRequestException(['Failed To create token']);
    }
    const { password: _, ...userWithoutPassword } = user;
    return { token, ...userWithoutPassword };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    try {
      const { email, otp } = verifyOtpDto;
      const redis = new RedisConnector().connect();
      const otpData = await redis.hgetall(email + '_otp');
      if (!otpData) {
        return 'OTP EXPIRED';
      }
      if (otpData?.otp?.toString() === otp) {
        let user = await this.prisma.users.findUnique({
          where: { email: email },
        });

        if (user) {
          user = await this.prisma.users.update({
            where: { email: email },
            data: { is_verified: true },
          });
        } else {
          throw new Error('User not found!');
        }
        return 'Verification Success';
      }
      return 'WRONG OTP';
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async authenticateByOtp(email: string, expires_in: number = 600) {
    try {
      const doesUserExist = await this.prisma.users.findUnique({
        where: { email: email },
      });
      if (!doesUserExist) {
        throw new BadRequestException('User does not exist with this email.');
      }
      const otp = generateOTP();
      const redis = new RedisConnector().connect();
      const created_at = new Date();
      await redis.hset(email + '_otp', { otp, created_at });
      await redis.expire(email + '_otp', expires_in);
      const transporter = createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      } as TransportOptions);
      // const transporter = createTransport({
      //   host: 'smtpout.secureserver.net',
      //   port: 465, // or 587 if you're using TLS
      //   secure: true,
      //   auth: {
      //     user: process.env.EMAIL,
      //     pass: process.env.GMAIL_APP_PASSWORD,
      //   },
      // } as TransportOptions);
      const options = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Gamer Gizmo : Verify you account',
        html: ejs.render(
          otpTemplate(doesUserExist.username || 'User', otp, expires_in),
        ),
      };
      await transporter.sendMail(options);
      return { email, expires_in, created_at };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async getUser() {
    const newUser = await this.prisma.users.findMany({
      where: { email: 'usman@gmail.com' },
    });
    return { message: 'Successs', data: newUser };
  }
}
