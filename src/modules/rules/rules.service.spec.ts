import { Test, TestingModule } from '@nestjs/testing';
import { RulesService } from './rules.service';
import { Rule } from '../../entities/rule.entity';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

describe('RulesService', () => {
  let service: RulesService;
  let prisma: { rule: { [method: string]: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      rule: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [RulesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(RulesService);
  });

  describe('create', () => {
    it('should create a rule', async () => {
      const dto: CreateRuleDto = {
        name: 'Test',
        similarityThreshold: 10,
      } as CreateRuleDto;
      const rule = { id: '1', ...dto } as Rule;
      prisma.rule.create.mockResolvedValue(rule);

      const result = await service.create(dto);

      expect(prisma.rule.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toBe(rule);
    });

    it('should throw BadRequestException when thresholds conflict', async () => {
      const dto: CreateRuleDto = {
        name: 'Bad',
        similarityThreshold: 10,
        deviationAllowedPct: 5,
      } as CreateRuleDto;

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a rule when found', async () => {
      const rule = { id: '1', name: 'Test' } as Rule;
      prisma.rule.findUnique.mockResolvedValue(rule);

      const result = await service.findOne('1');
      expect(prisma.rule.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toBe(rule);
    });

    it('should throw NotFoundException when rule not found', async () => {
      prisma.rule.findUnique.mockResolvedValue(null);
      await expect(service.findOne('2')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing rule', async () => {
      const rule = { id: '1', name: 'Test' } as Rule;
      prisma.rule.findUnique.mockResolvedValue(rule);
      prisma.rule.update.mockResolvedValue({ ...rule, name: 'Updated' });

      const result = await service.update('1', {
        name: 'Updated',
      } as UpdateRuleDto);

      expect(prisma.rule.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated' },
      });
      expect(result.name).toBe('Updated');
    });

    it('should throw BadRequestException when thresholds conflict', async () => {
      const rule = { id: '1', name: 'Test' } as Rule;
      prisma.rule.findUnique.mockResolvedValue(rule);

      await expect(
        service.update('1', {
          similarityThreshold: 1,
          deviationAllowedPct: 1,
        } as UpdateRuleDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove a rule', async () => {
      const rule = { id: '1' } as Rule;
      prisma.rule.findUnique.mockResolvedValue(rule);
      prisma.rule.delete.mockResolvedValue(rule);

      await service.remove('1');
      expect(prisma.rule.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
