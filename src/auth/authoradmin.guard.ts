import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthOrAdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Try validating as a regular user (AuthGuard logic)
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      const tokenCount = await this.prisma.tokens.count({
        where: { token: token },
      });
      if (tokenCount > 0) {
        request['user'] = payload;
        return true; // User is authenticated, allow access
      }
    } catch (e) {
      // User validation failed, try admin validation
    }

    // Try validating as an admin (AdminAuthGuard logic)
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET_ADMIN,
      });
      request['admin'] = payload;
      return true; // Admin is authenticated, allow access
    } catch (e) {
      throw new UnauthorizedException('Invalid token for both user and admin');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}