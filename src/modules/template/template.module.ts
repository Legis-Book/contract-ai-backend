import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { StandardClause } from './entities/standard-clause.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [TypeOrmModule.forFeature([StandardClause])],
  controllers: [TemplateController],
  providers: [PrismaService, TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
