import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../entities/contract.entity';
import { Clause } from '../../entities/clause.entity';
import { RiskFlag } from '../../entities/risk-flag.entity';
import { Summary } from '../../entities/summary.entity';
import { QnA } from '../../entities/qna.entity';
import { HumanReview } from '../../entities/human-review.entity';
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
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Clause)
    private clauseRepository: Repository<Clause>,
    @InjectRepository(RiskFlag)
    private riskFlagRepository: Repository<RiskFlag>,
    @InjectRepository(Summary)
    private summaryRepository: Repository<Summary>,
    @InjectRepository(QnA)
    private qnaRepository: Repository<QnA>,
    @InjectRepository(HumanReview)
    private humanReviewRepository: Repository<HumanReview>,
    private aiService: AiService,
  ) {}

  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const contract = this.contractRepository.create(createContractDto);
    return await this.contractRepository.save(contract);
  }

  async findAll(): Promise<Contract[]> {
    return await this.contractRepository.find({
      relations: ['clauses', 'riskFlags', 'summaries', 'qnas', 'reviews'],
    });
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['clauses', 'riskFlags', 'summaries', 'qnas', 'reviews'],
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
    const contract = await this.findOne(id);
    Object.assign(contract, updateContractDto);
    return await this.contractRepository.save(contract);
  }

  async remove(id: string): Promise<void> {
    const contract = await this.findOne(id);
    await this.contractRepository.remove(contract);
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

    const contract = this.contractRepository.create({
      title: file.originalname,
      filename: file.originalname,
      contractType,
      status: 'pending_review',
      fullText,
    });

    return await this.contractRepository.save(contract);
  }

  async analyzeContract(id: string): Promise<Contract> {
    const contract = await this.findOne(id);

    if (!contract.fullText) {
      // Try to extract text if file is available (not implemented here, as file is not stored)
      throw new BadRequestException('Contract text is required for analysis');
    }

    // Analyze contract using AI
    const analysis = await this.aiService.analyzeContract(
      contract.fullText,
      contract.contractType,
    );

    // Transform clauses data to match schema
    const transformedClauses = analysis.clauses.map((clauseData) => ({
      ...clauseData,
      id: crypto.randomUUID(), // Generate UUID for clause
    }));

    // Transform risks data to match schema
    const transformedRisks = analysis.risks.map((riskData) => ({
      ...riskData,
      id: crypto.randomUUID(), // Generate UUID for risk flag
    }));

    // Save clauses
    const clauses = await Promise.all(
      transformedClauses.map((clauseData) =>
        this.clauseRepository.save({
          ...clauseData,
          contract,
        }),
      ),
    );

    // Save risk flags
    const riskFlags = await Promise.all(
      transformedRisks.map((riskData) =>
        this.riskFlagRepository.save({
          ...riskData,
          contract,
          clause: new Clause(),
        }),
      ),
    );

    // Save summary
    const summary = await this.summaryRepository.save({
      content:
        typeof analysis.summary === 'string'
          ? analysis.summary
          : JSON.stringify(analysis.summary),
      summaryType: 'FULL',
      contract,
    });

    // Update contract status
    contract.status = 'IN_REVIEW';
    contract.clauses = clauses;
    contract.riskFlags = riskFlags;
    contract.summaries = [summary];

    return await this.contractRepository.save(contract);
  }

  async getContractSummary(id: string): Promise<Summary[]> {
    const contract = await this.findOne(id);
    return contract.summaries;
  }

  async getContractRisks(id: string): Promise<RiskFlag[]> {
    const contract = await this.findOne(id);
    return contract.riskFlags;
  }

  async getAnalysis(
    id: string,
  ): Promise<{ summaries: Summary[]; riskFlags: RiskFlag[] }> {
    const contract = await this.findOne(id);
    return {
      summaries: contract.summaries,
      riskFlags: contract.riskFlags,
    };
  }

  async getContractQnA(id: string): Promise<QnA[]> {
    const contract = await this.findOne(id);
    return contract.qnas;
  }

  async updateRiskFlag(
    contractId: string,
    riskId: string,
    status: 'open' | 'resolved' | 'ignored',
    notes?: string,
  ): Promise<RiskFlag> {
    await this.findOne(contractId);
    const riskFlag = await this.riskFlagRepository.findOne({
      where: { id: riskId, contract: { id: contractId } },
    });
    if (!riskFlag) {
      throw new NotFoundException(
        `Risk flag with ID ${riskId} not found for contract ${contractId}`,
      );
    }
    Object.assign(riskFlag, { status, notes });
    return this.riskFlagRepository.save(riskFlag);
  }

  async exportAnalysis(id: string): Promise<ExportAnalysisResult> {
    const contract = await this.findOne(id);
    return {
      contract,
      summaries: contract.summaries,
      riskFlags: contract.riskFlags,
      qna: contract.qnas,
    };
  }

  async getContractReviews(id: string): Promise<HumanReview[]> {
    const contract = await this.findOne(id);
    return contract.reviews;
  }

  async askQuestion(id: string, question: string): Promise<QnA> {
    const contract = await this.findOne(id);

    if (!contract.fullText) {
      throw new BadRequestException('Contract text is required for Q&A');
    }

    const answer = await this.aiService.answerQuestion(
      question,
      contract.fullText,
    );

    const qna = await this.qnaRepository.save({
      question,
      answer: answer.answer,
      contract,
    });

    return qna;
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
