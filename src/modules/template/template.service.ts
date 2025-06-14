import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { StandardClause } from '@orm/prisma';
import { CreateStandardClauseDto } from './dto/create-standard-clause.dto';
import { UpdateStandardClauseDto } from './dto/update-standard-clause.dto';
import { Deviation } from './interfaces/deviation.interface';
import { AllowedDeviationDto as AllowedDeviation } from './dto/allowed-deviation.dto';

@Injectable()
export class TemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createStandardClauseDto: CreateStandardClauseDto,
  ): Promise<StandardClause> {
    return await this.prisma.standardClause.create({
      data: {
        ...createStandardClauseDto,
        isActive: true,
        isLatest: true,
        version: '1.0.0',
        nextVersions: [],
      } as any,
    });
  }

  async findAll(): Promise<StandardClause[]> {
    return await this.prisma.standardClause.findMany({
      where: { isActive: true, isLatest: true },
    });
  }

  async findOne(id: string | number): Promise<StandardClause> {
    const standardClause = await this.prisma.standardClause.findUnique({
      where: { id: id as any },
    });
    if (!standardClause) {
      throw new NotFoundException(`Standard clause with ID ${id} not found`);
    }
    return standardClause;
  }

  async update(
    id: string | number,
    updateStandardClauseDto: UpdateStandardClauseDto,
  ): Promise<StandardClause> {
    const standardClause = await this.findOne(id);

    // If there are significant changes, create a new version
    if (this.hasSignificantChanges(standardClause, updateStandardClauseDto)) {
      // Mark current version as not latest
      await this.prisma.standardClause.update({
        where: { id: id as any },
        data: { isLatest: false },
      });

      // Create new version
      const newVersion = await this.prisma.standardClause.create({
        data: {
          name: updateStandardClauseDto.name!,
          type: updateStandardClauseDto.type!,
          text: updateStandardClauseDto.text!,
          jurisdiction: updateStandardClauseDto.jurisdiction ?? null,
          previousVersionId: Number(id),
          isActive: true,
          isLatest: true,
          contractType: updateStandardClauseDto.type ?? '',
          version: this.incrementVersion(standardClause.version ?? '1.0.0'),
        },
      });
      return newVersion;
    }

    // Otherwise, update existing version
    return await this.prisma.standardClause.update({
      where: { id: id as any },
      data: updateStandardClauseDto as any,
    });
  }

  async remove(id: string | number): Promise<void> {
    await this.findOne(id);
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

  async compareClause(
    clauseText: string,
    templateId: string | number,
  ): Promise<{
    similarity: number;
    isCompliant: boolean;
    deviations: Deviation[];
  }> {
    const template = await this.findOne(templateId);
    const similarity = this.calculateSimilarity(clauseText, template.text);
    const deviations = this.checkDeviations({ text: clauseText }, template);
    const isCompliant = this.isCompliantWithDeviations(deviations);

    return {
      similarity,
      isCompliant,
      deviations,
    };
  }

  async getTemplateVersions(id: string | number): Promise<StandardClause[]> {
    let currentVersion = await this.findOne(id);
    const versions: StandardClause[] = [currentVersion];
    while (currentVersion.previousVersionId) {
      const previousVersion = await this.prisma.standardClause.findUnique({
        where: { id: currentVersion.previousVersionId },
      });
      if (!previousVersion) break;
      versions.push(previousVersion);
      currentVersion = previousVersion;
    }

    return versions.reverse();
  }

  private hasSignificantChanges(
    current: StandardClause,
    update: UpdateStandardClauseDto,
  ): boolean {
    return (
      update.text !== current.text ||
      JSON.stringify(update.allowedDeviations) !==
        JSON.stringify(current.allowedDeviations) ||
      update.type !== current.type ||
      update.jurisdiction !== current.jurisdiction
    );
  }

  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple implementation - can be enhanced with more sophisticated algorithms
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter((word) => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private checkDeviations(
    clause: Partial<StandardClause>,
    template: StandardClause,
  ): Deviation[] {
    const deviations: Deviation[] = [];
    // Example: check if clauseText matches template.text
    if (clause.text !== template.text) {
      deviations.push({
        type: 'text',
        description: 'Clause text does not match template',
        severity: 'medium',
      });
    }
    // Example: check numeric fields against allowedDeviations thresholds
    if (
      template.allowedDeviations &&
      Array.isArray(template.allowedDeviations)
    ) {
      for (const allowed of template.allowedDeviations as unknown as AllowedDeviation[]) {
        // Validate allowed.type is a key of StandardClause and the value is a number
        if (
          typeof allowed.type === 'string' &&
          allowed.type in template &&
          typeof (template as any)[allowed.type] === 'number' &&
          typeof allowed.threshold === 'number'
        ) {
          const value = (clause as any)[allowed.type];
          const threshold = allowed.threshold;
          if (value > threshold) {
            deviations.push({
              type: allowed.type,
              description: `${allowed.type} value (${value}) exceeds allowed threshold (${threshold})`,
              severity: (['low', 'medium', 'high'].includes(
                allowed.severity ?? '',
              )
                ? allowed.severity
                : 'medium') as 'low' | 'medium' | 'high',
            });
          }
        }
      }
    }
    return deviations;
  }

  private isCompliantWithDeviations(deviations: Deviation[]): boolean {
    // Return true only if all deviations are LOW or MEDIUM severity
    return deviations.every(
      (deviation) =>
        !deviation.severity ||
        deviation.severity === 'low' ||
        deviation.severity === 'medium',
    );
  }
}
