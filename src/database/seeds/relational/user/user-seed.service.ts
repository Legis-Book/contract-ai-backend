import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class UserSeedService {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const users = [
      {
        id: 1,
        email: 'admin@example.com',
        password: 'admin123',
        roleId: 1,
        statusId: 1,
        firstName: 'Admin',
        lastName: 'User',
      },
      {
        id: 2,
        email: 'user@example.com',
        password: 'user123',
        roleId: 2,
        statusId: 1,
        firstName: 'Regular',
        lastName: 'User',
      },
    ];
    for (const user of users) {
      await this.prisma.userEntity.upsert({
        where: { id: user.id },
        update: { ...user },
        create: user,
      });
    }
  }
}
