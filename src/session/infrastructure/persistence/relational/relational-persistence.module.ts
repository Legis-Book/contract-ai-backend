import { Module } from '@nestjs/common';
import { SessionRepository } from '../session.repository';
import { SessionRelationalRepository } from './repositories/session.repository';
import { PrismaModule } from 'nestjs-prisma';

@Module({
  providers: [
    {
      provide: SessionRepository,
      useClass: SessionRelationalRepository,
    },
  ],
  exports: [SessionRepository],
  imports: [PrismaModule.forRoot()],
})
export class RelationalSessionPersistenceModule {}
