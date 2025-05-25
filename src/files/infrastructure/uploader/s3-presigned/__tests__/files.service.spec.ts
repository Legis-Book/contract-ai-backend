import { FilesS3PresignedService } from '../files.service';
import { FileRepository } from '../../../persistence/file.repository';
import { ConfigService } from '@nestjs/config';
import {
  UnprocessableEntityException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => Promise.resolve('signed')),
}));
jest.mock('@nestjs/common/utils/random-string-generator.util', () => ({
  randomStringGenerator: () => 'rand',
}));

describe('FilesS3PresignedService', () => {
  let service: FilesS3PresignedService;
  let repo: jest.Mocked<FileRepository>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    repo = { create: jest.fn() } as any;
    config = {
      get: jest.fn().mockReturnValue(100),
      getOrThrow: jest.fn().mockReturnValue('bucket'),
    } as any;
    service = new FilesS3PresignedService(repo, config);
  });

  it('should throw if file missing', async () => {
    await expect(service.create(undefined as any)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('should throw for invalid extension', async () => {
    const file = { fileName: 'file.txt', fileSize: 1 } as any;
    await expect(service.create(file)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('should throw when file is too large', async () => {
    const file = { fileName: 'file.jpg', fileSize: 200 } as any;
    config.get.mockReturnValueOnce(50); // maxFileSize
    await expect(service.create(file)).rejects.toBeInstanceOf(
      PayloadTooLargeException,
    );
  });

  it('should return file and signed url', async () => {
    const file = { fileName: 'image.png', fileSize: 1 } as any;
    repo.create.mockResolvedValue({ id: 1, path: 'rand.png' } as any);
    await expect(service.create(file)).resolves.toEqual({
      file: { id: 1, path: 'rand.png' },
      uploadSignedUrl: 'signed',
    });
    expect(getSignedUrl).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith({ path: 'rand.png' });
  });
});
