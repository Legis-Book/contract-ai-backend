import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import validateConfig from '../utils/validate-config';
import { MilvusConfig } from './milvus-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  MILVUS_ADDRESS: string;

  @IsString()
  MILVUS_COLLECTION: string;
}

export default registerAs<MilvusConfig>('milvus', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    address: process.env.MILVUS_ADDRESS,
    collection: process.env.MILVUS_COLLECTION,
  };
});
