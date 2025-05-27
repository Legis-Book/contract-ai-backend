import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { StandardClause } from '../../generated/prisma';
import { CreateStandardClauseDto } from './dto/create-standard-clause.dto';
import { UpdateStandardClauseDto } from './dto/update-standard-clause.dto';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: { standardClause: { [method: string]: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      standardClause: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TemplatesService);
  });

  describe('create', () => {
    it('should create a standard clause', async () => {
      const dto: CreateStandardClauseDto = {
        name: 'Test',
        type: 'NDA',
        content: 'Text',
      } as CreateStandardClauseDto;
      const created = {
        id: '1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      } as unknown as StandardClause;

      prisma.standardClause.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prisma.standardClause.create).toHaveBeenCalledWith({
        data: { isActive: true, ...dto },
      });
      expect(result).toBe(created);
    });
  });

  describe('findOne', () => {
    it('should return a clause by id', async () => {
      const clause = { id: '1' } as unknown as StandardClause;
      prisma.standardClause.findUnique.mockResolvedValue(clause);

      const result = await service.findOne('1');

      expect(prisma.standardClause.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toBe(clause);
    });

    it('should throw NotFoundException if clause does not exist', async () => {
      prisma.standardClause.findUnique.mockResolvedValue(null);

      await expect(service.findOne('2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a clause', async () => {
      const clause = { id: '1', name: 'A' } as unknown as StandardClause;
      const dto: UpdateStandardClauseDto = {
        name: 'B',
      } as UpdateStandardClauseDto;

      prisma.standardClause.findUnique.mockResolvedValue(clause);
      prisma.standardClause.update.mockResolvedValue({
        ...clause,
        ...dto,
      });

      const result = await service.update('1', dto);

      expect(prisma.standardClause.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: dto,
      });
      expect(result).toEqual({ ...clause, ...dto });
    });

    it('should throw NotFoundException if clause does not exist', async () => {
      prisma.standardClause.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'New Name' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should mark a clause as inactive', async () => {
      const clause = { id: '1', isActive: true } as unknown as StandardClause;

      prisma.standardClause.update.mockResolvedValue({
        ...clause,
        isActive: false,
      });

      await service.remove('1');

      expect(prisma.standardClause.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if clause does not exist', async () => {
      prisma.standardClause.update.mockRejectedValue(new NotFoundException());

      await expect(service.remove('nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByType', () => {
    it('should return clauses by type', async () => {
      const clauses = [{ id: '1' }] as unknown as StandardClause[];
      prisma.standardClause.findMany.mockResolvedValue(clauses);

      const result = await service.findByType('NDA');

      expect(prisma.standardClause.findMany).toHaveBeenCalledWith({
        where: { type: 'NDA', isActive: true },
        orderBy: { createdAt: 'DESC' },
      });
      expect(result).toBe(clauses);
    });
  });

  describe('findByJurisdiction', () => {
    it('should return clauses by jurisdiction', async () => {
      const clauses = [{ id: '1' }] as unknown as StandardClause[];
      prisma.standardClause.findMany.mockResolvedValue(clauses);

      const result = await service.findByJurisdiction('US');

      expect(prisma.standardClause.findMany).toHaveBeenCalledWith({
        where: { jurisdiction: 'US', isActive: true },
        orderBy: { createdAt: 'DESC' },
      });
      expect(result).toBe(clauses);
    });
  });
});
