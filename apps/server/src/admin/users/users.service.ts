import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    return await this.prisma.user.findMany({
      include: {
        chatStats: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
