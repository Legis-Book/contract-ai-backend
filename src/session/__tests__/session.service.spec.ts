import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../session.service';
import { SessionRepository } from '../infrastructure/persistence/session.repository';

describe('SessionService', () => {
  let service: SessionService;
  let repository: jest.Mocked<SessionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: SessionRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteById: jest.fn(),
            deleteByUserId: jest.fn(),
            deleteByUserIdWithExclude: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SessionService);
    repository = module.get(SessionRepository);
  });

  it('should delegate findById', async () => {
    repository.findById.mockResolvedValue({ id: '1' } as any);
    await expect(service.findById('1')).resolves.toEqual({ id: '1' });
    expect(repository.findById).toHaveBeenCalledWith('1');
  });

  it('should delegate create', async () => {
    const session = { id: '1' } as any;
    repository.create.mockResolvedValue(session);
    await expect(service.create(session)).resolves.toBe(session);
    expect(repository.create).toHaveBeenCalledWith(session);
  });

  it('should delegate update', async () => {
    repository.update.mockResolvedValue({ id: '1', hash: 'h' } as any);
    await expect(service.update('1', { hash: 'h' })).resolves.toEqual({
      id: '1',
      hash: 'h',
    });
    expect(repository.update).toHaveBeenCalledWith('1', { hash: 'h' });
  });

  it('should delegate deleteById', async () => {
    repository.deleteById.mockResolvedValue();
    await expect(service.deleteById('1')).resolves.toBeUndefined();
    expect(repository.deleteById).toHaveBeenCalledWith('1');
  });

  it('should delegate deleteByUserId', async () => {
    repository.deleteByUserId.mockResolvedValue();
    const conditions = { userId: 'u1' } as any;
    await expect(service.deleteByUserId(conditions)).resolves.toBeUndefined();
    expect(repository.deleteByUserId).toHaveBeenCalledWith(conditions);
  });

  it('should delegate deleteByUserIdWithExclude', async () => {
    repository.deleteByUserIdWithExclude.mockResolvedValue();
    const conditions = { userId: 'u1', excludeSessionId: 's2' } as any;
    await expect(
      service.deleteByUserIdWithExclude(conditions),
    ).resolves.toBeUndefined();
    expect(repository.deleteByUserIdWithExclude).toHaveBeenCalledWith(
      conditions,
    );
  });
});
