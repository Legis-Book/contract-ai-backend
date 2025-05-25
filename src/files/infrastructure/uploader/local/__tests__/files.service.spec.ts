import { FilesLocalService } from '../files.service';
import { ConfigService } from '@nestjs/config';
import { FileRepository } from '../../../persistence/file.repository';
import { UnprocessableEntityException } from '@nestjs/common';

describe('FilesLocalService', () => {
  let service: FilesLocalService;
  let repo: jest.Mocked<FileRepository>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    repo = { create: jest.fn() } as any;
    config = { get: jest.fn(() => 'api') } as any;
    service = new FilesLocalService(config, repo);
  });

  it('should throw if file missing', async () => {
    await expect(service.create(undefined as any)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('should create file with prefixed path', async () => {
    repo.create.mockResolvedValue({ id: 1, path: '/api/v1/file' } as any);
    const file = { path: 'upload/file' } as any;
    await expect(service.create(file)).resolves.toEqual({
      file: { id: 1, path: '/api/v1/file' },
    });
    expect(repo.create).toHaveBeenCalledWith({ path: '/api/v1/upload/file' });
    expect(config.get).toHaveBeenCalledWith('app.apiPrefix', { infer: true });
  });
});
