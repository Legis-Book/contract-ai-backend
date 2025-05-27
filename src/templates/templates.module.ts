import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TemplatesController],
  providers: [PrismaService, TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
