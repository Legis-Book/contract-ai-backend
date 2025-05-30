import { Module } from '@nestjs/common';
import { SessionRepository } from '../session.repository';
import { SessionRelationalRepository } from './repositories/session.repository';
import { PrismaModule } from '@src/prisma/prisma.module';

@Module({
  providers: [
    {
      provide: SessionRepository,
      useClass: SessionRelationalRepository,
    },
  ],
  exports: [SessionRepository],
  imports: [PrismaModule],
})
export class RelationalSessionPersistenceModule {}
