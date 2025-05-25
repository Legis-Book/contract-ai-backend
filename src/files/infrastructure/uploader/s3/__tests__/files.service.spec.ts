import { FilesS3Service } from '../files.service';
import { FileRepository } from '../../../persistence/file.repository';
import { UnprocessableEntityException } from '@nestjs/common';

describe('FilesS3Service', () => {
  let service: FilesS3Service;
  let repo: jest.Mocked<FileRepository>;

  beforeEach(() => {
    repo = { create: jest.fn() } as any;
    service = new FilesS3Service(repo);
  });

  it('should throw if file missing', async () => {
    await expect(service.create(undefined as any)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it('should create file using key', async () => {
    repo.create.mockResolvedValue({ id: 1, path: 'key' } as any);
    const file = { key: 'key' } as any;
    await expect(service.create(file)).resolves.toEqual({
      file: { id: 1, path: 'key' },
    });
    expect(repo.create).toHaveBeenCalledWith({ path: 'key' });
  });
});
