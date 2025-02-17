import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateAdminDto, CreateUserDto } from './dtos/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateOTP } from 'src/utils/otp.generator';
import { ConfigService } from '@nestjs/config';
import { RedisConnector } from 'src/redis/database.connector';
import { JwtService } from '@nestjs/jwt';
import * as ejs from 'ejs';
import { createTransport } from 'nodemailer';
import { otpTemplate } from 'src/views/otp.template';
import { LoginAdminDto, LoginUserDto } from './dtos/login-user.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';
import { LogoutUserDto } from './dtos/logout-user.dto';
import { logoutTemplate } from 'src/views/logout.template';
import { ForgetPassDto } from './dtos/forgetPass.dto';
import { SendPassOtpDto } from './dtos/send-pass-otp.dto';

@Injectable()
export class AuthService {
  private readonly secretKey = process.env.JWT_SECRET; // Replace with your secret key
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
      dob,
      gender,
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
    let otp_res;
    try {
      otp_res = await this.authenticateByOtp(email, false);
    } catch (err) {
      throw new BadRequestException(
        'Failed to send OTP email. Please Try again.',
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
        //@ts-ignore
        is_email_verified: false,
        dob: new Date(dob),
        gender,
      },
    });
    if (!newUser) {
      throw new BadRequestException(['Could not create user!']);
    }
    // const otp_res = await this.authenticateByOtp(email);
    const { password: _, ...userWithoutPassword } = newUser;
    return {
      message: 'Email has been sent to email',
      data: { user: userWithoutPassword, otp: otp_res },
    };
  }

  async Adminsignup(createUserDto: CreateAdminDto) {
    const { email, password, name } = createUserDto;

    const doesUserExist = await this.prisma.admin.findUnique({
      where: { email: email },
    });

    if (doesUserExist) {
      throw new BadRequestException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.prisma.admin.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });
    if (!newUser) {
      throw new BadRequestException(['Could not create user!']);
    }
    // const otp_res = await this.authenticateByOtp(email);
    const { password: _, ...userWithoutPassword } = newUser;
    return {
      message: 'Admin has been Craeted',
      data: { user: userWithoutPassword },
    };
  }

  async AdminSignin(createUserDto: LoginAdminDto) {
    const { email, password } = createUserDto;

    let user = await this.prisma.admin.findUnique({
      where: { email: email },
    });

    if (!user) {
      throw new BadRequestException('No User Found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect email or password');
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: user.type,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET_ADMIN'),
      expiresIn: '7d',
    });
    if (!token) {
      throw new BadRequestException(['Failed To create token']);
    }
    const { password: _, ...userWithoutPassword } = user;
    return { token, ...userWithoutPassword };
  }
  async signin(createUserDto: LoginUserDto) {
    const { name, password, platform, region = null } = createUserDto;

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
    //@ts-ignore
    const isUserVerified = user.is_email_verified;
    if (!isUserVerified) {
      await this.authenticateByOtp(user.email);
      throw new BadRequestException(
        'User is not Verified, Email is sent to the registerd email',
      );
    }
    if (!user.is_active) {
      throw new BadRequestException(
        'Account is deactivated right now. Contact Support',
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
    const tokenCount = await this.prisma.tokens.count({
      where: { user_id: user.id },
    });
    if (tokenCount >= 5) {
      const tokens = await this.prisma.tokens.findMany({
        where: { user_id: user.id },
      });
      throw new BadRequestException({
        message: 'You have reached max account logins',
        accounts: tokens,
      });
    }

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });
    if (!token) {
      throw new BadRequestException(['Failed To create token']);
    }
    const createdToken = await this.prisma.tokens.create({
      data: {
        user_id: user.id,
        token: token,
        platform: platform,
        //@ts-ignore
        region: region,
      },
    });
    if (!createdToken) {
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
            //@ts-ignore
            data: { is_email_verified: true },
          });
          const cart = await this.prisma.cart.create({
            data: {
              user_id: user.id,
              updated_at: new Date(),
            },
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
  async authenticateByOtp(
    email: string,
    checkUser = true,
    expires_in: number = 600,
  ) {
    try {
      const doesUserExist = await this.prisma.users.findUnique({
        where: { email: email },
      });
      if (!doesUserExist && checkUser) {
        throw new BadRequestException('User does not exist with this email.');
      }
      const otp = generateOTP();
      const redis = new RedisConnector().connect();
      const created_at = new Date();
      await redis.hset(email + '_otp', { otp, created_at });
      await redis.expire(email + '_otp', expires_in);

      const transporter = createTransport({
        host: 'smtp-mail.outlook.com', // GoDaddy's SMTP server
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      const options = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Gamer Gizmo : Verify your account',
        html: ejs.render(
          otpTemplate(doesUserExist?.username || 'User', otp, expires_in),
        ),
      };
      await transporter.sendMail(options);
      return { email, expires_in, created_at };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
  async generateLogoutLink(userId, token) {
    // Generate a JWT or a unique token for the logout URL
    const logoutToken = await this.jwtService.signAsync(
      { userId: userId, token: token },
      { expiresIn: '1hr' },
    );

    // Return the URL with the token
    return `https://gamergizmo.com/logout-accounts?token=${logoutToken}`;
  }
  async sendLogoutEmail(data: any, expires_in: number = 600) {
    try {
      const logoutLink = await this.generateLogoutLink(
        data.users.id,
        data.token,
      );
      const doesUserExist = await this.prisma.users.findUnique({
        where: { email: data.users.email },
      });
      if (!doesUserExist) {
        throw new BadRequestException('User does not exist with this email.');
      }
      const transporter = createTransport({
        host: 'smtp-mail.outlook.com', // GoDaddy's SMTP server
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      const options = {
        from: process.env.EMAIL,
        to: data.users.email,
        subject: 'Gamer Gizmo : Logout your account',
        html: ejs.render(
          logoutTemplate(
            doesUserExist?.username,
            logoutLink,
            data.platform,
            data.created_at,
          ),
        ),
      };
      await transporter.sendMail(options);
      return true;
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async logoutOtherAccounts(logoutDto: LogoutUserDto) {
    try {
      const tokenWithUser = await this.prisma.tokens.findUnique({
        where: {
          token: logoutDto.token, // Ensure 'token' is the correct field
        },
        include: {
          users: true, // Include related user data based on the 'user_id' relation
        },
      });

      if (!tokenWithUser) {
        throw new BadRequestException('Token not found');
      }
      this.sendLogoutEmail(tokenWithUser);
      return { message: 'Email Sent To  logged out' };
    } catch (error) {
      throw new BadRequestException('Token not found or invalid');
    }
  }
  async logoutUser(logoutDto: LogoutUserDto) {
    try {
      const deletedToken = await this.prisma.tokens.delete({
        where: {
          token: logoutDto.token, // Ensure that 'token' is the correct field in your Prisma schema
        },
      });
      return { message: 'Successfully logged out' };
    } catch (error) {
      throw new BadRequestException('Token not found or invalid');
    }
  }
  async emailLogoutConfirmation(token: string) {
    let decodedToken;
    try {
      decodedToken = await this.jwtService.verify(token, {
        secret: this.secretKey,
      });
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
    const tokenFound = await this.prisma.tokens.findUnique({
      where: {
        user_id: decodedToken.userId,
        token: decodedToken.token,
      },
    });
    if (!tokenFound) {
      throw new BadRequestException('Token not found');
    }
    const deletedToken = await this.prisma.tokens.delete({
      where: {
        user_id: decodedToken.userId,
        token: decodedToken.token,
      },
    });

    return { message: 'Successfully logged out' };
  }
  async sendForgetPasswordOtp(
    sendPassOtp: SendPassOtpDto,
    expires_in: number = 600,
  ) {
    const doesUserExist = await this.prisma.users.findUnique({
      where: { email: sendPassOtp.email },
    });
    if (!doesUserExist) {
      throw new BadRequestException('User does not exist with this email.');
    }
    const otp = generateOTP();
    const redis = new RedisConnector().connect();
    const created_at = new Date();
    await redis.hset(sendPassOtp.email + '_reset_otp', { otp, created_at });
    await redis.expire(sendPassOtp.email + '_reset_otp', expires_in);
    const transporter = createTransport({
      host: 'smtp-mail.outlook.com', // GoDaddy's SMTP server
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    const options = {
      from: process.env.EMAIL,
      to: sendPassOtp.email,
      subject: 'Gamer Gizmo : Reset your password',
      html: ejs.render(
        otpTemplate(doesUserExist?.username || 'User', otp, expires_in),
      ),
    };
    await transporter.sendMail(options);
  }

  async updatePassword({ email, password, otp }: ForgetPassDto) {
    const doesUserExist = await this.prisma.users.findUnique({
      where: { email: email },
    });
    if (!doesUserExist) {
      throw new BadRequestException('User does not exist with this email.');
    }
    const redis = new RedisConnector().connect();
    const otpData = await redis.hgetall(email + '_reset_otp');
    if (!otpData) {
      return 'OTP EXPIRED';
    }
    if (otpData?.otp?.toString() === otp) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.prisma.users.update({
        where: { email: email },
        data: { password: hashedPassword },
      });
      return 'Password Updated';
    }
    return 'WRONG OTP';
  }
}
