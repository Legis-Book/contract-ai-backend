import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import * as bcrypt from 'bcrypt';
// import { RoleEnum } from 'src/common/enums/role.enum';
// import { StatusEnum } from 'src/common/enums/status.enum';
// import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class UserSeedService {
  // TODO: Migrate to Prisma
  // constructor(
  //   @InjectRepository(UserEntity)
  //   private repository: Repository<UserEntity>,
  // ) {}

  async run() {
    // TODO: Implement with Prisma
  }
}
