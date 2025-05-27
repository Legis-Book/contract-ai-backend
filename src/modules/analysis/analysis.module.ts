import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [AnalysisController],
  providers: [PrismaService, AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
