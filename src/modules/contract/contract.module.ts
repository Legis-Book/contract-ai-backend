import { Module, forwardRef } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { AiModule } from '../ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { ContractHybridService } from './contract-hybrid.service';
import { PrismaModule } from '@src/prisma/prisma.module';

@Module({
  imports: [forwardRef(() => AiModule), ConfigModule, PrismaModule],
  providers: [ContractService, ContractHybridService],
  controllers: [ContractController],
  exports: [ContractService],
})
export class ContractModule {}
