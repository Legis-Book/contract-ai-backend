import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import validateConfig from '../utils/validate-config';
import { LangfuseConfig } from './langfuse-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  LANGFUSE_PUBLIC_KEY: string;

  @IsString()
  LANGFUSE_SECRET_KEY: string;

  @IsString()
  LANGFUSE_BASE_URL: string;
}

export default registerAs<LangfuseConfig>('langfuse', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
    secretKey: process.env.LANGFUSE_SECRET_KEY!,
    baseUrl: process.env.LANGFUSE_BASE_URL!,
  };
});
