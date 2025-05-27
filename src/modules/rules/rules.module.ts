import { Module } from '@nestjs/common';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [RulesController],
  providers: [PrismaService, RulesService],
  exports: [RulesService],
})
export class RulesModule {}
