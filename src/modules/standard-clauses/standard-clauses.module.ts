import { Module } from '@nestjs/common';
import { StandardClausesService } from './standard-clauses.service';
import { StandardClausesController } from './standard-clauses.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [StandardClausesController],
  providers: [PrismaService, StandardClausesService],
  exports: [StandardClausesService],
})
export class StandardClausesModule {}
