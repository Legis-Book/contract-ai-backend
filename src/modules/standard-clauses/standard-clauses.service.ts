import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { StandardClause } from '../../../generated/prisma';
import { CreateStandardClauseDto } from './dto/create-standard-clause.dto';
import { UpdateStandardClauseDto } from './dto/update-standard-clause.dto';

@Injectable()
export class StandardClausesService {
  private prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(
    createStandardClauseDto: CreateStandardClauseDto,
  ): Promise<StandardClause> {
    return await this.prisma.standardClause.create({
      data: createStandardClauseDto,
    });
  }

  async findAll(): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany();
  }

  async findOne(id: number): Promise<StandardClause> {
    const standardClause = await this.prisma.standardClause.findUnique({
      where: { id },
    });
    if (!standardClause) {
      throw new NotFoundException(`Standard clause with ID ${id} not found`);
    }
    return standardClause;
  }

  async findByType(type: string): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany({ where: { type } });
  }

  async findByContractType(contractType: string): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany({
      where: { contractType },
    });
  }

  async update(
    id: number,
    updateStandardClauseDto: UpdateStandardClauseDto,
  ): Promise<StandardClause> {
    await this.findOne(id);
    return await this.prisma.standardClause.update({
      where: { id },
      data: updateStandardClauseDto,
    });
  }

  async remove(id: number): Promise<void> {
    await this.prisma.standardClause.delete({ where: { id } }).catch(() => {
      throw new NotFoundException(`Standard clause with ID ${id} not found`);
    });
  }
}
