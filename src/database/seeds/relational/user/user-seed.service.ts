import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import * as bcrypt from 'bcrypt';
// import { RoleEnum } from 'src/common/enums/role.enum';
// import { StatusEnum } from 'src/common/enums/status.enum';
// import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class UserSeedService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO: Migrate to Prisma
  // constructor(
  //   @InjectRepository(UserEntity)
  //   private repository: Repository<UserEntity>,
  // ) {}

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
