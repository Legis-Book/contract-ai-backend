import { Module } from '@nestjs/common';
import { StandardClausesService } from './standard-clauses.service';
import { StandardClausesController } from './standard-clauses.controller';
import { PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [PrismaModule.forRoot()],
  controllers: [StandardClausesController],
  providers: [StandardClausesService],
  exports: [StandardClausesService],
})
export class StandardClausesModule {}
