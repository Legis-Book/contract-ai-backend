import { UsersService } from '../users.service';
import { UserRepository } from '../infrastructure/persistence/user.repository';
import { FilesService } from '../../files/files.service';
import { UnprocessableEntityException } from '@nestjs/common';
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => Promise.resolve('salt')),
  hash: jest.fn(() => Promise.resolve('hashed')),
}));
import * as bcrypt from 'bcryptjs';
import { AuthProvidersEnum } from '../../auth/auth-providers.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<UserRepository>;
  let files: jest.Mocked<FilesService>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findManyWithPagination: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findBySocialIdAndProvider: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;
    files = { findById: jest.fn() } as any;
    service = new UsersService(repo, files);
  });

  it('should throw if email already exists', async () => {
    repo.findByEmail.mockResolvedValue({ id: 1 } as any);
    await expect(
      service.create({
        email: 'a@b.c',
        firstName: 'a',
        lastName: 'b',
        password: 'p',
      } as any),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should create user with hashed password', async () => {
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 1 } as any);
    const dto = {
      email: 'a@b.c',
      firstName: 'a',
      lastName: 'b',
      password: 'p',
    } as any;
    const result = await service.create(dto);
    expect(result).toEqual({ id: 1 });
    expect(bcrypt.hash).toHaveBeenCalledWith('p', 'salt');
    expect(repo.create).toHaveBeenCalledWith({
      firstName: 'a',
      lastName: 'b',
      email: 'a@b.c',
      password: 'hashed',
      photo: undefined,
      role: undefined,
      status: undefined,
      provider: AuthProvidersEnum.email,
      socialId: undefined,
    });
  });
});
