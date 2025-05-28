import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { PrismaModule } from 'nestjs-prisma';

@Module({
  imports: [ConfigModule, PrismaModule.forRoot()],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
