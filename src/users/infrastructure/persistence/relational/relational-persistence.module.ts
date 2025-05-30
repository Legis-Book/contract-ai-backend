import { Module } from '@nestjs/common';
import { UserRepository } from '../user.repository';
import { UsersRelationalRepository } from './repositories/user.repository';
import { PrismaModule } from '../../../../prisma/prisma.module';

@Module({
  providers: [
    {
      provide: UserRepository,
      useClass: UsersRelationalRepository,
    },
  ],
  exports: [UserRepository],
  imports: [PrismaModule],
})
export class RelationalUserPersistenceModule {}
