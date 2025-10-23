import { ExecutionContext, Injectable, UnauthorizedException, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestUser } from '../dto/request-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);
    const isApiKeyEnabled = this.reflector.getAllAndOverride<boolean>('isApiKeyEnabled', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    if (isApiKeyEnabled) {
      return true;
    }

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const adminEmail = await this.prisma.adminEmail.findUnique({
      where: {
        email: user.email,
      },
    });

    if (!adminEmail) {
      throw new UnauthorizedException('User is not authorized to access this resource');
    }

    return true;
  }
}
