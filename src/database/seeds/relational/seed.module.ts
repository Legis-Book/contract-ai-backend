import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoleSeedModule } from './role/role-seed.module';
import { StatusSeedModule } from './status/status-seed.module';
import { UserSeedModule } from './user/user-seed.module';
import databaseConfig from '../../config/database.config';
import appConfig from '../../../config/app.config';
import { PrismaModule } from '@src/prisma/prisma.module';

@Module({
  imports: [
    RoleSeedModule,
    StatusSeedModule,
    UserSeedModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    PrismaModule,
  ],
})
export class SeedModule {}
