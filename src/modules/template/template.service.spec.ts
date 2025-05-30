import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { StandardClause } from '../../../generated/prisma';
import { CreateStandardClauseDto } from './dto/create-standard-clause.dto';
import { UpdateStandardClauseDto } from './dto/update-standard-clause.dto';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

describe('TemplateService', () => {
  let service: TemplateService;
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
        TemplateService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TemplateService);
  });

  describe('create', () => {
    it('should create a template clause', async () => {
      const dto: CreateStandardClauseDto = {
        name: 'Clause',
        type: 'nda',
        text: 'text',
        jurisdiction: 'us',
      } as CreateStandardClauseDto;
      const clause = { id: 1, ...dto } as unknown as StandardClause;
      prisma.standardClause.create.mockResolvedValue(clause);

      const result = await service.create(dto);

      expect(prisma.standardClause.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          isActive: true,
          isLatest: true,
          version: '1.0.0',
          nextVersions: [],
        },
      });
      expect(result).toBe(clause);
    });
  });

  describe('findAll', () => {
    it('should return all active and latest templates', async () => {
      const templates = [
        {
          id: 1,
          name: 'Clause 1',
          isActive: true,
          isLatest: true,
        } as unknown as StandardClause,
        {
          id: 2,
          name: 'Clause 2',
          isActive: true,
          isLatest: true,
        } as unknown as StandardClause,
      ];
      prisma.standardClause.findMany.mockResolvedValue(templates);

      const result = await service.findAll();

      expect(prisma.standardClause.findMany).toHaveBeenCalledWith({
        where: { isActive: true, isLatest: true },
      });
      expect(result).toBe(templates);
    });
  });

  describe('findOne', () => {
    it('should return the template when found', async () => {
      const template = {
        id: 1,
        name: 'Clause',
        isActive: true,
        isLatest: true,
      } as unknown as StandardClause;
      prisma.standardClause.findUnique.mockResolvedValue(template);

      const result = await service.findOne('1');

      expect(prisma.standardClause.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toBe(template);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.standardClause.findUnique.mockResolvedValue(null);
      await expect(service.findOne('1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('compareClause', () => {
    it('should compare text and return similarity and deviations', async () => {
      const template = {
        id: '1',
        text: 'standard text',
        type: 'nda',
        jurisdiction: 'us',
        version: '1.0.0',
        isActive: true,
        isLatest: true,
      } as unknown as StandardClause;
      prisma.standardClause.findUnique.mockResolvedValue(template);

      const result = await service.compareClause('some standard text', '1');

      expect(prisma.standardClause.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result.similarity).toBeGreaterThan(0);
      expect(Array.isArray(result.deviations)).toBe(true);
    });
  });

  describe('update', () => {
    it('should create new version when significant changes', async () => {
      const existing = {
        id: '1',
        name: 'Old',
        text: 'old text',
        type: 'nda',
        jurisdiction: 'us',
        version: '1.0.0',
        isActive: true,
        isLatest: true,
        nextVersions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as StandardClause;
      prisma.standardClause.findUnique.mockResolvedValue(existing);
      prisma.standardClause.update.mockResolvedValue({
        ...existing,
        isLatest: false,
      });
      prisma.standardClause.create.mockResolvedValue({
        ...existing,
        id: '2',
        text: 'new text',
        version: '1.0.1',
      });

      const result = await service.update('1', {
        text: 'new text',
      } as UpdateStandardClauseDto);

      expect(prisma.standardClause.update).toHaveBeenCalled();
      expect(result.version).toBe('1.0.1');
    });
  });
});
