import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { StandardClause } from '@orm/prisma';
import { CreateStandardClauseDto } from './dto/create-standard-clause.dto';
import { UpdateStandardClauseDto } from './dto/update-standard-clause.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createStandardClauseDto: CreateStandardClauseDto,
  ): Promise<StandardClause> {
    return await this.prisma.standardClause.create({
      data: { isActive: true, ...createStandardClauseDto } as any,
    });
  }

  async findAll(): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string | number): Promise<StandardClause> {
    const clause = await this.prisma.standardClause.findUnique({
      where: { id: id as any },
    });

    if (!clause) {
      throw new NotFoundException(`Standard clause with ID "${id}" not found`);
    }

    return clause;
  }

  async update(
    id: string | number,
    updateStandardClauseDto: UpdateStandardClauseDto,
  ): Promise<StandardClause> {
    await this.findOne(id);
    return await this.prisma.standardClause.update({
      where: { id: id as any },
      data: updateStandardClauseDto,
    });
  }

  async remove(id: string | number): Promise<void> {
    await this.prisma.standardClause.update({
      where: { id: id as any },
      data: { isActive: false },
    });
  }

  async findByType(type: string): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany({
      where: { type, isActive: true },
      orderBy: { createdAt: 'DESC' } as any,
    });
  }

  async findByJurisdiction(jurisdiction: string): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany({
      where: { jurisdiction, isActive: true },
      orderBy: { createdAt: 'DESC' } as any,
    });
  }
}
