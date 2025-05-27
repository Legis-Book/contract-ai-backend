import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rule } from '../../entities/rule.entity';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rule])],
  controllers: [RulesController],
  providers: [PrismaService, RulesService],
  exports: [RulesService],
})
export class RulesModule {}
