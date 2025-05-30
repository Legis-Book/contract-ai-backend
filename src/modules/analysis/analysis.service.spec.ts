import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from './analysis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotFoundException } from '@nestjs/common';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      contract: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: {} },
      ],
    }).compile();

    service = module.get(AnalysisService);
  });

  it('should call prisma.create with pending status', async () => {
    const dto = { title: 't', type: 'NDA' };
    prisma.contract.create.mockResolvedValue({ id: '1' });
    await service.createContract(dto as any);
    expect(prisma.contract.create).toHaveBeenCalledWith({
      data: { ...dto, status: 'pending_review' },
    });
  });

  it('should throw when not found', async () => {
    prisma.contract.findUnique.mockResolvedValue(null);
    await expect(service.findContract('1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
