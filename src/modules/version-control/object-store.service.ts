import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { AllConfigType } from '../../config/config.type';

@Injectable()
export class ObjectStoreService {
  private s3: S3Client;
  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.s3 = new S3Client({
      region: configService.get('file.awsS3Region', { infer: true }),
      credentials: {
        accessKeyId: configService.get('file.accessKeyId', { infer: true }),
        secretAccessKey: configService.get('file.secretAccessKey', {
          infer: true,
        }),
      },
    });
  }

  async storeBlobIfAbsent(sha: string, data: Buffer) {
    const bucket = this.configService.getOrThrow('file.awsDefaultS3Bucket', {
      infer: true,
    });
    const key = `blobs/${sha.substring(0, 2)}/${sha}`;
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      await this.s3.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: data }),
      );
    }
  }
}
