import { Test, TestingModule } from '@nestjs/testing';
import { ContractService } from './contract.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('../ai/ai.service', () => ({
  AiService: jest.fn().mockImplementation(() => ({
    analyzeContract: jest.fn(),
  })),
}));

jest.mock('scribe.js-ocr', () => ({
  default: { extractText: jest.fn().mockResolvedValue('text') },
}));

describe('ContractService', () => {
  let service: ContractService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      contract: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
        { provide: PrismaService, useValue: prisma },
        { provide: AiService, useValue: {} },
      ],
    }).compile();

    service = module.get(ContractService);
  });

  it('should return contract when found', async () => {
    const contract = { id: '1' };
    prisma.contract.findUnique.mockResolvedValue(contract);
    await expect(service.findOne('1')).resolves.toBe(contract);
  });

  it('should throw when not found', async () => {
    prisma.contract.findUnique.mockResolvedValue(null);
    await expect(service.findOne('2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should throw for missing file', async () => {
    await expect(
      service.uploadContract(undefined as any, 'NDA'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for bad type', async () => {
    const bad: any = {
      mimetype: 'text/plain',
      size: 1,
      originalname: 'a',
      buffer: Buffer.from(''),
    };
    await expect(service.uploadContract(bad, 'NDA')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
