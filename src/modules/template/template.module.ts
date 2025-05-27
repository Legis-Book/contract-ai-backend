import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [TemplateController],
  providers: [PrismaService, TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
