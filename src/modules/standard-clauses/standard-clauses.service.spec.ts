import { Test, TestingModule } from '@nestjs/testing';
import { StandardClausesService } from './standard-clauses.service';
import { StandardClause } from '../../../generated/prisma';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

describe('StandardClausesService', () => {
  let service: StandardClausesService;
  let prisma: { standardClause: { [method: string]: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      standardClause: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StandardClausesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(StandardClausesService);
  });

  describe('create', () => {
    it('should create and save clause', async () => {
      const dto = {
        name: 'A',
        type: 't',
        contractType: 'c',
        text: 'txt',
      };
      const entity = { id: 1, ...dto } as unknown as StandardClause;
      prisma.standardClause.create.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(prisma.standardClause.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toBe(entity);
    });
  });

  describe('findOne', () => {
    it('should return clause when found', async () => {
      const clause = { id: 1 } as unknown as StandardClause;
      prisma.standardClause.findUnique.mockResolvedValue(clause);

      const result = await service.findOne(1);

      expect(prisma.standardClause.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toBe(clause);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.standardClause.findUnique.mockResolvedValue(undefined);

      await expect(service.findOne(2)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete clause', async () => {
      prisma.standardClause.delete.mockResolvedValue({});
      await service.remove(1);
      expect(prisma.standardClause.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when nothing deleted', async () => {
      prisma.standardClause.delete.mockRejectedValue({ code: 'P2025' });
      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all clauses', async () => {
      const clauses = [{ id: 1 }, { id: 2 }] as unknown as StandardClause[];
      prisma.standardClause.findMany.mockResolvedValue(clauses);

      const result = await service.findAll();

      expect(prisma.standardClause.findMany).toHaveBeenCalled();
      expect(result).toBe(clauses);
    });
  });

  describe('findByType', () => {
    it('should return clauses by type', async () => {
      const type = 'confidentiality';
      const clauses = [{ id: 1, type }] as unknown as StandardClause[];
      prisma.standardClause.findMany.mockResolvedValue(clauses);

      const result = await service.findByType(type);

      expect(prisma.standardClause.findMany).toHaveBeenCalledWith({
        where: { type },
      });
      expect(result).toBe(clauses);
    });
  });

  describe('findByContractType', () => {
    it('should return clauses by contract type', async () => {
      const contractType = 'NDA';
      const clauses = [{ id: 1, contractType }] as unknown as StandardClause[];
      prisma.standardClause.findMany.mockResolvedValue(clauses);

      const result = await service.findByContractType(contractType);

      expect(prisma.standardClause.findMany).toHaveBeenCalledWith({
        where: { contractType },
      });
      expect(result).toBe(clauses);
    });
  });

  describe('update', () => {
    it('should update and return the clause', async () => {
      const id = 1;
      const existing = {
        id,
        name: 'A',
        type: 't',
        contractType: 'c',
        text: 'txt',
      } as unknown as StandardClause;
      const dto = { name: 'B', text: 'new text' };
      const updated = { ...existing, ...dto } as unknown as StandardClause;
      const findOneMock = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(existing);
      prisma.standardClause.update.mockResolvedValue(updated);

      const result = await service.update(id, dto);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(prisma.standardClause.update).toHaveBeenCalledWith({
        where: { id },
        data: dto,
      });
      expect(result).toBe(updated);

      findOneMock.mockRestore();
    });
  });
});
