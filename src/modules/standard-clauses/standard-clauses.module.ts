import { Module } from '@nestjs/common';
import { StandardClausesService } from './standard-clauses.service';
import { StandardClausesController } from './standard-clauses.controller';
import { PrismaModule } from '@src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StandardClausesController],
  providers: [StandardClausesService],
  exports: [StandardClausesService],
})
export class StandardClausesModule {}
