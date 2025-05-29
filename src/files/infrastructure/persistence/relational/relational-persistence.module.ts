import { Module } from '@nestjs/common';
import { FileRepository } from '../file.repository';
import { FileRelationalRepository } from './repositories/file.repository';
import { PrismaModule } from '@src/prisma/prisma.module';

@Module({
  providers: [
    {
      provide: FileRepository,
      useClass: FileRelationalRepository,
    },
  ],
  exports: [FileRepository],
  imports: [PrismaModule],
})
export class RelationalFilePersistenceModule {}
