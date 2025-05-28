import { Module } from '@nestjs/common';
import { FileRepository } from '../file.repository';
import { FileRelationalRepository } from './repositories/file.repository';
import { PrismaModule } from 'nestjs-prisma';

@Module({
  providers: [
    {
      provide: FileRepository,
      useClass: FileRelationalRepository,
    },
  ],
  exports: [FileRepository],
  imports: [PrismaModule.forRoot()],
})
export class RelationalFilePersistenceModule {}
