import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SessionService } from '../session/session.service';
import { ConfigService } from '@nestjs/config';
import { UnprocessableEntityException } from '@nestjs/common';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));
jest.mock('@nestjs/common/utils/random-string-generator.util', () => ({
  randomStringGenerator: () => 'rand',
}));

import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let sessionService: jest.Mocked<SessionService>;
  let jwtService: jest.Mocked<JwtService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    usersService = { findByEmail: jest.fn() } as any;
    sessionService = { create: jest.fn() } as any;
    jwtService = { signAsync: jest.fn() } as any;
    config = { getOrThrow: jest.fn(() => '1h') } as any;
    service = new AuthService(
      jwtService as any,
      usersService as any,
      sessionService as any,
      {} as any,
      config as any,
    );
  });

  it('should throw if user not found', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(
      service.validateLogin({ email: 'a', password: 'p' } as any),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should throw if provider not email', async () => {
    usersService.findByEmail.mockResolvedValue({ provider: 'google' } as any);
    await expect(
      service.validateLogin({ email: 'a', password: 'p' } as any),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should throw if password missing', async () => {
    usersService.findByEmail.mockResolvedValue({ provider: 'email' } as any);
    await expect(
      service.validateLogin({ email: 'a', password: 'p' } as any),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should throw if password invalid', async () => {
    usersService.findByEmail.mockResolvedValue({
      provider: 'email',
      password: 'hash',
    } as any);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(
      service.validateLogin({ email: 'a', password: 'p' } as any),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('should return tokens and user on success', async () => {
    const user = {
      id: 1,
      provider: 'email',
      password: 'hash',
      role: 'u',
    } as any;
    usersService.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    sessionService.create.mockResolvedValue({ id: 's1' } as any);
    jwtService.signAsync.mockResolvedValueOnce('t').mockResolvedValueOnce('r');
    config.getOrThrow.mockImplementation((key: string) => {
      switch (key) {
        case 'auth.secret':
          return 'sec';
        case 'auth.refreshSecret':
          return 'ref';
        case 'auth.refreshExpires':
          return '1h';
        default:
          return '1h';
      }
    });
    const result = await service.validateLogin({
      email: 'a',
      password: 'p',
    } as any);
    expect(result.token).toBe('t');
    expect(result.refreshToken).toBe('r');
    expect(sessionService.create).toHaveBeenCalled();
  });

  it('should throw on refresh when session not found', async () => {
    sessionService.findById = jest.fn().mockResolvedValue(null);
    await expect(
      service.refreshToken({ sessionId: 's1', hash: 'h' } as any),
    ).rejects.toBeInstanceOf(Error);
  });

  it('should call deleteById on logout', async () => {
    sessionService.deleteById = jest.fn().mockResolvedValue(undefined);
    await service.logout({ sessionId: 's1' } as any);
    expect(sessionService.deleteById).toHaveBeenCalledWith('s1');
  });

  it('should call usersService.remove on softDelete', async () => {
    usersService.remove = jest.fn();
    await service.softDelete({ id: 'u1' } as any);
    expect(usersService.remove).toHaveBeenCalledWith('u1');
  });
});
