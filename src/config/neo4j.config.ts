import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import validateConfig from '../utils/validate-config';
import { Neo4jConfig } from './neo4j-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  NEO4J_URI: string;

  @IsString()
  NEO4J_USER: string;

  @IsString()
  NEO4J_PASSWORD: string;
}

export default registerAs<Neo4jConfig>('neo4j', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    uri: process.env.NEO4J_URI!,
    user: process.env.NEO4J_USER!,
    password: process.env.NEO4J_PASSWORD!,
  };
});
