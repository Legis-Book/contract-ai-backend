import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Rule } from '../../../generated/prisma';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateThresholds(dto: CreateRuleDto | UpdateRuleDto) {
    if (
      dto.similarityThreshold !== undefined &&
      dto.deviationAllowedPct !== undefined
    ) {
      throw new BadRequestException(
        'similarityThreshold and deviationAllowedPct cannot both be set',
      );
    }
    // pattern validation is now handled by the IsValidRegex decorator at the DTO level
  }

  async create(dto: CreateRuleDto): Promise<Rule> {
    this.validateThresholds(dto);
    return await this.prisma.rule.create({ data: dto });
  }

  async findAll(): Promise<Rule[]> {
    return await this.prisma.rule.findMany();
  }

  async findOne(id: string): Promise<Rule> {
    const rule = await this.prisma.rule.findUnique({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }
    return rule;
  }

  async update(id: string, dto: UpdateRuleDto): Promise<Rule> {
    await this.findOne(id);
    this.validateThresholds(dto);
    return await this.prisma.rule.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.rule.delete({ where: { id } });
  }
}
