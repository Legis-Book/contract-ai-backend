import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Contract,
  Clause,
  RiskFlag,
  Summary,
  QnA,
  HumanReview,
} from '../../../generated/prisma';
import { ClauseType } from './entities/clause.entity';
import { RiskType, RiskSeverity } from './entities/risk-flag.entity';
import { SummaryType } from './entities/summary.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateClauseDto } from './dto/create-clause.dto';
import { UpdateClauseDto } from './dto/update-clause.dto';
import { CreateRiskFlagDto } from './dto/create-risk-flag.dto';
import { UpdateRiskFlagDto } from './dto/update-risk-flag.dto';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { UpdateSummaryDto } from './dto/update-summary.dto';
import { CreateQnADto } from './dto/create-qna.dto';
import { UpdateQnADto } from './dto/update-qna.dto';
import { CreateHumanReviewDto } from './dto/create-human-review.dto';
import { UpdateHumanReviewDto } from './dto/update-human-review.dto';
import { ContractStatus } from './entities/contract.entity';
import { ReviewStatus } from './entities/human-review.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  // Contract operations
  async createContract(
    createContractDto: CreateContractDto,
  ): Promise<Contract> {
    return await this.prisma.contract.create({
      data: {
        ...createContractDto,
        status: ContractStatus.PENDING_REVIEW,
      },
    });
  }

  async findAllContracts(): Promise<Contract[]> {
    return await this.prisma.contract.findMany({
      include: {
        clauses: true,
        riskFlags: true,
        summaries: true,
        reviews: true,
      },
    });
  }

  async findContract(id: string): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        clauses: true,
        riskFlags: true,
        summaries: true,
        reviews: true,
      },
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }
    return contract;
  }

  async updateContract(
    id: string,
    updateContractDto: UpdateContractDto,
  ): Promise<Contract> {
    await this.findContract(id);
    return await this.prisma.contract.update({
      where: { id },
      data: updateContractDto,
    });
  }

  async removeContract(id: string): Promise<void> {
    await this.findContract(id);
    await this.prisma.contract.delete({ where: { id } });
  }

  // Clause operations
  async createClause(
    contractId: string,
    createClauseDto: CreateClauseDto,
  ): Promise<Clause> {
    return await this.prisma.clause.create({
      data: {
        ...createClauseDto,
        contractId,
      },
    });
  }

  async findContractClauses(contractId: string): Promise<Clause[]> {
    return await this.prisma.clause.findMany({
      where: { contractId },
      include: { riskFlags: true, summaries: true },
    });
  }

  async findClause(id: string): Promise<Clause> {
    const clause = await this.prisma.clause.findUnique({
      where: { id },
      include: { contract: true, riskFlags: true, summaries: true },
    });
    if (!clause) {
      throw new NotFoundException(`Clause with ID ${id} not found`);
    }
    return clause;
  }

  async updateClause(
    id: string,
    updateClauseDto: UpdateClauseDto,
  ): Promise<Clause> {
    await this.findClause(id);
    return await this.prisma.clause.update({
      where: { id },
      data: updateClauseDto,
    });
  }

  async removeClause(id: string): Promise<void> {
    await this.findClause(id);
    await this.prisma.clause.delete({ where: { id } });
  }

  // Risk flag operations
  async createRiskFlag(
    contractId: string,
    clauseId: string | null,
    createRiskFlagDto: CreateRiskFlagDto,
  ): Promise<RiskFlag> {
    return await this.prisma.riskFlag.create({
      data: {
        ...createRiskFlagDto,
        contractId,
        ...(clauseId ? { clauseId } : {}),
      },
    });
  }

  async findContractRiskFlags(contractId: string): Promise<RiskFlag[]> {
    return await this.prisma.riskFlag.findMany({
      where: { contractId },
      include: { clause: true },
    });
  }

  async findRiskFlag(id: string): Promise<RiskFlag> {
    const riskFlag = await this.prisma.riskFlag.findUnique({
      where: { id },
      include: { contract: true, clause: true },
    });
    if (!riskFlag) {
      throw new NotFoundException(`Risk flag with ID ${id} not found`);
    }
    return riskFlag;
  }

  async updateRiskFlag(
    id: string,
    updateRiskFlagDto: UpdateRiskFlagDto,
  ): Promise<RiskFlag> {
    await this.findRiskFlag(id);
    return await this.prisma.riskFlag.update({
      where: { id },
      data: updateRiskFlagDto,
    });
  }

  async removeRiskFlag(id: string): Promise<void> {
    await this.findRiskFlag(id);
    await this.prisma.riskFlag.delete({ where: { id } });
  }

  // Summary operations
  async createSummary(
    contractId: string,
    clauseId: string | null,
    createSummaryDto: CreateSummaryDto,
  ): Promise<Summary> {
    return await this.prisma.summary.create({
      data: {
        ...createSummaryDto,
        contractId,
        ...(clauseId ? { clauseId } : {}),
      },
    });
  }

  async findContractSummaries(contractId: string): Promise<Summary[]> {
    return await this.prisma.summary.findMany({
      where: { contractId },
      include: { clause: true },
    });
  }

  async findSummary(id: string): Promise<Summary> {
    const summary = await this.prisma.summary.findUnique({
      where: { id },
      include: { contract: true, clause: true },
    });
    if (!summary) {
      throw new NotFoundException(`Summary with ID ${id} not found`);
    }
    return summary;
  }

  async updateSummary(
    id: string,
    updateSummaryDto: UpdateSummaryDto,
  ): Promise<Summary> {
    await this.findSummary(id);
    return await this.prisma.summary.update({
      where: { id },
      data: updateSummaryDto,
    });
  }

  async removeSummary(id: string): Promise<void> {
    await this.findSummary(id);
    await this.prisma.summary.delete({ where: { id } });
  }

  // Q&A operations
  async createQnA(
    contractId: string,
    clauseId: string | null,
    createQnADto: CreateQnADto,
  ): Promise<QnA> {
    return await this.prisma.qnA.create({
      data: {
        ...createQnADto,
        contractId,
        ...(clauseId ? { clauseId } : {}),
      },
    });
  }

  async findContractQnAs(contractId: string): Promise<QnA[]> {
    return await this.prisma.qnA.findMany({
      where: { contractId },
      include: { clause: true },
    });
  }

  async findQnA(id: string): Promise<QnA> {
    const qna = await this.prisma.qnA.findUnique({
      where: { id },
      include: { contract: true, clause: true },
    });
    if (!qna) {
      throw new NotFoundException(`Q&A with ID ${id} not found`);
    }
    return qna;
  }

  async updateQnA(id: string, updateQnADto: UpdateQnADto): Promise<QnA> {
    await this.findQnA(id);
    return await this.prisma.qnA.update({
      where: { id },
      data: updateQnADto,
    });
  }

  async removeQnA(id: string): Promise<void> {
    await this.findQnA(id);
    await this.prisma.qnA.delete({ where: { id } });
  }

  // Human review operations
  async createHumanReview(
    contractId: string,
    createHumanReviewDto: CreateHumanReviewDto,
  ): Promise<HumanReview> {
    return await this.prisma.humanReview.create({
      data: {
        ...createHumanReviewDto,
        contractId,
      },
    });
  }

  async findContractReviews(contractId: string): Promise<HumanReview[]> {
    return await this.prisma.humanReview.findMany({
      where: { contractId },
    });
  }

  async findReview(id: string): Promise<HumanReview> {
    const review = await this.prisma.humanReview.findUnique({
      where: { id },
      include: { contract: true },
    });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async updateReview(
    id: string,
    updateHumanReviewDto: UpdateHumanReviewDto,
  ): Promise<HumanReview> {
    await this.findReview(id);
    return await this.prisma.humanReview.update({
      where: { id },
      data: updateHumanReviewDto,
    });
  }

  async removeReview(id: string): Promise<void> {
    await this.findReview(id);
    await this.prisma.humanReview.delete({ where: { id } });
  }

  // Analysis operations
  async analyzeContract(contractId: string): Promise<void> {
    const contract = await this.findContract(contractId);

    // Update contract status
    contract.status = ContractStatus.IN_REVIEW;
    await this.prisma.contract.update({
      where: { id: contract.id },
      data: { status: contract.status },
    });

    // Create initial human review
    await this.createHumanReview(contractId, {
      status: ReviewStatus.PENDING,
      startDate: new Date(),
    });

    // Split contract into clauses
    const originalText = (contract as any).originalText as string | undefined;
    if (!originalText) {
      throw new Error('Contract text is not available');
    }
    const clauses = await this.aiService.splitIntoClauses(originalText);

    // Analyze each clause
    for (const [index, clauseText] of clauses.entries()) {
      // Create clause
      const clause = await this.createClause(contractId, {
        number: (index + 1).toString(),
        text: clauseText,
      });

      // Analyze clause
      const analysis = await this.aiService.analyzeClause(clauseText);

      // Update clause type
      await this.updateClause(clause.id, {
        type: analysis.type as ClauseType,
      });

      // Create risk flags
      for (const risk of analysis.risks) {
        await this.createRiskFlag(contractId, clause.id, {
          type: risk.type as RiskType,
          severity: risk.severity as RiskSeverity,
          description: risk.description,
          suggestedResolution: risk.suggestedResolution,
        });
      }

      // Generate clause summary
      const summaryObj = await this.aiService.generateSummary(clauseText);
      await this.createSummary(contractId, clause.id, {
        type: SummaryType.CLAUSE,
        text: JSON.stringify(summaryObj),
      });
    }

    // Generate contract summary
    if (!originalText) {
      throw new Error('Contract text is not available');
    }
    const contractSummaryObj =
      await this.aiService.generateSummary(originalText);
    await this.createSummary(contractId, null, {
      type: SummaryType.FULL,
      text: JSON.stringify(contractSummaryObj),
    });
  }

  async generateSummary(contractId: string, type: string): Promise<Summary> {
    const contract = await this.findContract(contractId);
    const originalText = (contract as any).originalText as string | undefined;
    if (!originalText) {
      throw new Error('Contract text is not available');
    }
    const summaryObj = await this.aiService.generateSummary(originalText);
    return this.createSummary(contractId, null, {
      type: type as SummaryType,
      text: JSON.stringify(summaryObj),
    });
  }

  async answerQuestion(
    contractId: string,
    clauseId: string | null,
    question: string,
  ): Promise<QnA> {
    const contract = await this.findContract(contractId);
    const originalText = (contract as any).originalText as string | undefined;
    if (!originalText) {
      throw new Error('Contract text is not available');
    }
    let context = originalText;

    if (clauseId) {
      const clause = await this.findClause(clauseId);
      context = clause.text;
    }

    const answerResult = await this.aiService.answerQuestion(question, context);
    let answer: string;
    if (
      answerResult &&
      typeof answerResult === 'object' &&
      'answer' in answerResult
    ) {
      answer = answerResult.answer;
    } else {
      answer = '';
    }
    return this.createQnA(contractId, clauseId, {
      question,
      answer,
    });
  }
}
