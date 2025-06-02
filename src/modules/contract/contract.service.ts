import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import {
  Contract,
  Summary,
  RiskFlag,
  QnA,
  HumanReview,
  ContractStatus,
  ContractType,
  ClauseType,
  RiskType,
  RiskSeverity,
  SummaryType,
  RiskFlagStatus,
  Clause,
  ClauseRiskLevel,
} from '@orm/prisma';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { AiService } from '../ai/ai.service';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import crypto from 'node:crypto';

export interface ExportAnalysisResult {
  contract: Contract;
  summaries: Summary[];
  riskFlags: RiskFlag[];
  qna: QnA[];
}

@Injectable()
export class ContractService {
  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
  ) {}
  async create(createContractDto: CreateContractDto): Promise<Contract> {
    return await this.prisma.contract.create({
      data: {
        ...createContractDto,
        status: createContractDto.status,
        uniqueHash: this.generateUniqueHash(createContractDto.fullText ?? ''),
      },
    });
  }

  async findAll(): Promise<Contract[]> {
    return await this.prisma.contract.findMany({
      include: {
        clauses: true,
        riskFlags: true,
        summaries: true,
        qnaInteractions: true,
        reviews: true,
      },
    });
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        clauses: true,
        riskFlags: true,
        summaries: true,
        qnaInteractions: true,
        reviews: true,
      },
    });
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }
    return contract;
  }

  async update(
    id: string,
    updateContractDto: UpdateContractDto,
  ): Promise<Contract> {
    await this.findOne(id); // Throws if not found
    return await this.prisma.contract.update({
      where: { id },
      data: updateContractDto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Throws if not found
    await this.prisma.contract.delete({ where: { id } });
  }

  async uploadContract(
    file: Express.Multer.File,
    contractType: string,
  ): Promise<Contract> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedTypes = [
      'application/pdf',
      // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX support can be added later
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported file type');
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large');
    }

    let fullText = '';
    if (file.mimetype === 'application/pdf') {
      // Write buffer to a temp file, extract text, then clean up
      const tempPath = join(
        tmpdir(),
        `upload-${Date.now()}-${Math.random()}.pdf`,
      );
      await fs.writeFile(tempPath, file.buffer);
      try {
        const scribe = await import('scribe.js-ocr').catch((e) => {
          console.error(e);
          throw new BadRequestException('Failed to extract text from PDF');
        });
        const results = await scribe.default.extractText([tempPath]);
        fullText = results;
      } catch (e) {
        console.error(e);
        throw new BadRequestException('Failed to extract text from PDF');
      } finally {
        await fs.unlink(tempPath).catch(() => {});
      }
    }

    const uniqueHash = this.generateUniqueHash(fullText);

    // Check if contract with this hash already exists
    const existingContract = await this.prisma.contract.findUnique({
      where: { uniqueHash },
      include: {
        clauses: true,
        riskFlags: true,
        summaries: true,
        qnaInteractions: true,
        reviews: true,
      },
    });

    if (existingContract) {
      return existingContract;
    }

    return await this.prisma.contract.create({
      data: {
        title: file.originalname,
        type: contractType.toUpperCase() as ContractType,
        status: ContractStatus.PENDING_REVIEW,
        originalText: fullText,
        uniqueHash,
      },
    });
  }
  generateUniqueHash(fullText: string): string {
    return crypto.createHash('sha256').update(fullText).digest('hex');
  }

  async analyzeContract(id: string): Promise<Contract> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        clauses: true,
        riskFlags: true,
        summaries: true,
        qnaInteractions: true,
        reviews: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    // If already analyzed (status IN_REVIEW or later, or has clauses/risks/summaries), return contract directly
    const alreadyAnalyzed =
      contract.status === ContractStatus.IN_REVIEW ||
      contract.status === ContractStatus.APPROVED ||
      (contract.clauses && contract.clauses.length > 0) ||
      (contract.riskFlags && contract.riskFlags.length > 0) ||
      (contract.summaries && contract.summaries.length > 0);

    if (alreadyAnalyzed) {
      return contract;
    }

    if (!contract.originalText) {
      throw new BadRequestException('Contract text is required for analysis');
    }

    // Analyze contract using AI
    const analysis = await this.aiService.analyzeContract(
      contract.originalText,
      contract.type,
    );

    const analysisId = crypto.randomUUID();

    // Transform clauses data to match schema
    const transformedClauses = analysis.clauses.map(
      (clauseData) =>
        ({
          id: crypto.randomUUID(), // Generate UUID for clause
          contractId: contract.id,
          number: clauseData.clauseNumber ?? '',
          type: clauseData.type?.toUpperCase() as ClauseType | null,
          startIndex: clauseData.startIndex ?? 0,
          endIndex: clauseData.endIndex ?? 0,
          confidence: clauseData.confidence ?? 0,
          entities: clauseData.entities?.join(',') ?? null,
          amounts: clauseData.amounts?.join(',') ?? null,
          dates: clauseData.dates?.join(',') ?? null,
          legalReferences: clauseData.legalReferences?.join(',') ?? null,
          obligation: String(clauseData.obligation) ?? null,
          riskLevel: clauseData.riskLevel as ClauseRiskLevel | null,
          riskJustification: clauseData.riskJustification ?? null,
          title: clauseData.title ?? null,
          text: clauseData.text ?? null,
          classification: clauseData.classification ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isReviewed: false,
          isApproved: false,
          suggestedText: null,
          analysisId,
        }) satisfies Clause,
    );

    // Save clauses
    await Promise.all(
      transformedClauses.map((clauseData) =>
        this.prisma.clause.create({
          data: {
            ...clauseData,
          },
        }),
      ),
    );

    // Transform risks data to match schema
    const transformedRisks = analysis.risks.map(
      async (riskData) =>
        ({
          id: crypto.randomUUID(), // Generate UUID for risk flag
          contractId: contract.id,
          type: riskData.type as RiskType,
          severity: riskData.severity as RiskSeverity,
          status: RiskFlagStatus.OPEN,
          createdAt: new Date(),
          updatedAt: new Date(),
          notes: '',
          isReviewed: false,
          reviewerComments: '',
          clauseId: await this.getClauseIdByNumber(
            analysisId,
            riskData.clauseNumber,
          ),
          isResolved: false,
          confidence: riskData.confidence ?? 0,
          analysisId,
          description: riskData.description ?? '',
          suggestedResolution: riskData.suggestedResolution ?? '',
        }) satisfies RiskFlag,
    );

    // Save risk flags
    await Promise.all(
      transformedRisks.map(async (riskData) =>
        this.prisma.riskFlag.create({
          data: await riskData,
        }),
      ),
    );

    // Save summary
    await this.prisma.summary.create({
      data: {
        text:
          typeof analysis.summary === 'string'
            ? analysis.summary
            : JSON.stringify(analysis.summary),
        type: SummaryType.FULL,
        contractId: contract.id,
      },
    });

    // Update contract status
    const updatedContract = await this.prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: 'IN_REVIEW',
      },
      include: {
        clauses: true,
        riskFlags: true,
        summaries: true,
        qnaInteractions: true,
        reviews: true,
      },
    });

    return updatedContract;
  }
  async getClauseIdByNumber(
    analysisId: string,
    clauseNumber: string | undefined,
  ): Promise<string | null> {
    const clause = await this.prisma.clause.findFirst({
      where: { number: clauseNumber, analysisId },
    });
    return clause?.id ?? null; // TODO: Handle multiple clauses with the same number
  }

  async getContractSummary(id: string): Promise<Summary[]> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { summaries: true },
    });
    if (!contract)
      throw new NotFoundException(`Contract with ID ${id} not found`);
    return contract.summaries;
  }

  async getContractRisks(id: string): Promise<RiskFlag[]> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { riskFlags: true },
    });
    if (!contract)
      throw new NotFoundException(`Contract with ID ${id} not found`);
    return contract.riskFlags;
  }

  async getAnalysis(id: string): Promise<{
    summaries: Summary[];
    riskFlags: RiskFlag[];
    clauses: Clause[];
  }> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { summaries: true, riskFlags: true, clauses: true },
    });
    if (!contract)
      throw new NotFoundException(`Contract with ID ${id} not found`);
    return {
      summaries: contract.summaries,
      riskFlags: contract.riskFlags,
      clauses: contract.clauses,
    };
  }

  async getContractQnA(id: string): Promise<QnA[]> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { qnaInteractions: true },
    });
    if (!contract)
      throw new NotFoundException(`Contract with ID ${id} not found`);
    return contract.qnaInteractions;
  }

  async updateRiskFlag(
    contractId: string,
    riskId: string,
    status: RiskFlagStatus,
    notes?: string,
  ): Promise<RiskFlag> {
    await this.findOne(contractId);
    const riskFlag = await this.prisma.riskFlag.findUnique({
      where: { id: riskId },
    });
    if (!riskFlag || riskFlag.contractId !== contractId) {
      throw new NotFoundException(
        `Risk flag with ID ${riskId} not found for contract ${contractId}`,
      );
    }
    return await this.prisma.riskFlag.update({
      where: { id: riskId },
      data: { status, notes },
    });
  }

  async exportAnalysis(id: string): Promise<ExportAnalysisResult> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { summaries: true, riskFlags: true, qnaInteractions: true },
    });
    if (!contract)
      throw new NotFoundException(`Contract with ID ${id} not found`);
    return {
      contract,
      summaries: contract.summaries,
      riskFlags: contract.riskFlags,
      qna: contract.qnaInteractions,
    };
  }

  async getContractReviews(id: string): Promise<HumanReview[]> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { reviews: true },
    });
    if (!contract)
      throw new NotFoundException(`Contract with ID ${id} not found`);
    return contract.reviews;
  }

  async askQuestion(id: string, question: string): Promise<QnA> {
    const contract = await this.findOne(id);

    if (!contract.originalText) {
      throw new BadRequestException('Contract text is required for Q&A');
    }

    const answer = await this.aiService.answerQuestion(
      question,
      contract.originalText,
    );

    return await this.prisma.qnA.create({
      data: {
        question,
        answer: answer.answer,
        contractId: contract.id,
      },
    });
  }

  // Dedicated chat methods for future differentiation
  async getContractChat(id: string): Promise<any[]> {
    // TODO: Implement chat-specific storage and retrieval
    const contract = await this.findOne(id);
    return [contract];
  }

  submitChat(_id: string, question: string): any {
    // TODO: Implement chat-specific storage and processing
    return { question, answer: 'Chat answer (stub)' };
  }
}
