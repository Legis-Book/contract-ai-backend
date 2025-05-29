import { registerAs } from '@nestjs/config';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import validateConfig from '../utils/validate-config';
import { FileConfig } from './file-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  AWS_S3_REGION: string;

  @IsString()
  AWS_S3_ACCESS_KEY_ID: string;

  @IsString()
  AWS_S3_SECRET_ACCESS_KEY: string;

  @IsString()
  AWS_S3_BUCKET: string;

  @IsNumber()
  MAX_FILE_SIZE: number;
}

export default registerAs<FileConfig>('file', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    awsS3Region: process.env.AWS_S3_REGION,
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    awsDefaultS3Bucket: process.env.AWS_S3_BUCKET,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '10000000', 10),
  };
});
