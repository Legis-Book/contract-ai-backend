import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Contract,
  Summary,
  RiskFlag,
  QnA,
  HumanReview,
} from '../../../generated/prisma';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { AiService } from '../ai/ai.service';
import scribe from 'scribe.js-ocr';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

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
    return await this.prisma.contract.create({ data: createContractDto });
  }

  async findAll(): Promise<Contract[]> {
    return await this.prisma.contract.findMany({
      include: {
        clauses: true,
        riskFlags: true,
        summaries: true,
        qnas: true,
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
        qnas: true,
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
        const results = await scribe.extractText([tempPath]);
        fullText = results;
      } catch (e) {
        console.error(e);
        throw new BadRequestException('Failed to extract text from PDF');
      } finally {
        await fs.unlink(tempPath).catch(() => {});
      }
    }

    return await this.prisma.contract.create({
      data: {
        title: file.originalname,
        filename: file.originalname,
        contractType,
        status: 'pending_review',
        fullText,
      },
    });
  }

  async analyzeContract(id: string): Promise<Contract> {
    const contract = await this.findOne(id);

    if (!contract.originalText) {
      throw new BadRequestException('Contract text is required for analysis');
    }

    // Analyze contract using AI
    const analysis = await this.aiService.analyzeContract(
      contract.originalText,
      contract.type,
    );

    // Transform clauses data to match schema
    const transformedClauses = analysis.clauses.map((clauseData) => ({
      ...clauseData,
      id: crypto.randomUUID(), // Generate UUID for clause
      contractId: contract.id,
    }));

    // Transform risks data to match schema
    const transformedRisks = analysis.risks.map((riskData) => ({
      ...riskData,
      id: crypto.randomUUID(), // Generate UUID for risk flag
      contractId: contract.id,
    }));

    // Save clauses
    await Promise.all(
      transformedClauses.map((clauseData) =>
        this.prisma.clause.create({ data: clauseData }),
      ),
    );

    // Save risk flags
    await Promise.all(
      transformedRisks.map((riskData) =>
        this.prisma.riskFlag.create({ data: riskData }),
      ),
    );

    // Save summary
    await this.prisma.summary.create({
      data: {
        content:
          typeof analysis.summary === 'string'
            ? analysis.summary
            : JSON.stringify(analysis.summary),
        summaryType: 'FULL',
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
        qnas: true,
        reviews: true,
      },
    });

    return updatedContract;
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

  async getAnalysis(
    id: string,
  ): Promise<{ summaries: Summary[]; riskFlags: RiskFlag[] }> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { summaries: true, riskFlags: true },
    });
    if (!contract)
      throw new NotFoundException(`Contract with ID ${id} not found`);
    return {
      summaries: contract.summaries,
      riskFlags: contract.riskFlags,
    };
  }

  async getContractQnA(id: string): Promise<QnA[]> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { qnas: true },
    });
    if (!contract)
      throw new NotFoundException(`Contract with ID ${id} not found`);
    return contract.qnas;
  }

  async updateRiskFlag(
    contractId: string,
    riskId: string,
    status: 'open' | 'resolved' | 'ignored',
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
      include: { summaries: true, riskFlags: true, qnas: true },
    });
    if (!contract)
      throw new NotFoundException(`Contract with ID ${id} not found`);
    return {
      contract,
      summaries: contract.summaries,
      riskFlags: contract.riskFlags,
      qna: contract.qnas,
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
