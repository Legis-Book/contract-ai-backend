import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { StandardClause } from '../../generated/prisma';
import { CreateStandardClauseDto } from './dto/create-standard-clause.dto';
import { UpdateStandardClauseDto } from './dto/update-standard-clause.dto';

@Injectable()
export class TemplatesService {
  private prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(
    createStandardClauseDto: CreateStandardClauseDto,
  ): Promise<StandardClause> {
    return await this.prisma.standardClause.create({
      data: { isActive: true, ...createStandardClauseDto },
    });
  }

  async findAll(): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<StandardClause> {
    const clause = await this.prisma.standardClause.findUnique({
      where: { id },
    });

    if (!clause) {
      throw new NotFoundException(`Standard clause with ID "${id}" not found`);
    }

    return clause;
  }

  async update(
    id: string,
    updateStandardClauseDto: UpdateStandardClauseDto,
  ): Promise<StandardClause> {
    await this.findOne(id);
    return await this.prisma.standardClause.update({
      where: { id },
      data: updateStandardClauseDto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.standardClause.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByType(type: string): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany({
      where: { type, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByJurisdiction(jurisdiction: string): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany({
      where: { jurisdiction, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}
