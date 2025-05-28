import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class RoleSeedService {
  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const roles = [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
      { id: 3, name: 'Manager' },
    ];
    for (const role of roles) {
      await this.prisma.role.upsert({
        where: { id: role.id },
        update: { name: role.name },
        create: role,
      });
    }
  }
}
