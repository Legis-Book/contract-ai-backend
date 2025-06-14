import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import configuration from '../../config/configuration';
import { LlmFactory } from './llm/llm.factory';
import { GeminiLlm } from './llm/gemini.llm';
import { OpenAiLlm } from './llm/openai.llm';
import { AiGateway } from './ai.gateway';
import { ContractModule } from '../contract/contract.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    forwardRef(() => ContractModule),
  ],
  providers: [AiService, LlmFactory, GeminiLlm, OpenAiLlm, AiGateway],
  exports: [AiService, AiGateway],
})
export class AiModule {}
