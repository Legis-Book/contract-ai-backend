import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      relations: ['clauses', 'riskFlags', 'summaries', 'qnas', 'reviews']
    });
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['clauses', 'riskFlags', 'summaries', 'qnas', 'reviews']
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  async update(id: string, updateContractDto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findOne(id);
    Object.assign(contract, updateContractDto);
    return await this.contractRepository.save(contract);
  }

  async remove(id: string): Promise<void> {
    const contract = await this.findOne(id);
    await this.contractRepository.remove(contract);
  }

  async uploadContract(file: Express.Multer.File, contractType: string): Promise<Contract> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // TODO: Implement file parsing logic based on file type
    // For now, we'll just create a basic contract record
    const contract = this.contractRepository.create({
      title: file.originalname,
      filename: file.filename,
      contractType,
      status: 'DRAFT'
    });

    return await this.contractRepository.save(contract);
  }

  async analyzeContract(id: string): Promise<Contract> {
    const contract = await this.findOne(id);
    
    if (!contract.fullText) {
      throw new BadRequestException('Contract text is required for analysis');
    }

    // Analyze contract using AI
    const analysis = await this.aiService.analyzeContract(
      contract.fullText,
      contract.contractType
    );

    // Save clauses
    const clauses = await Promise.all(
      analysis.clauses.map(clauseData =>
        this.clauseRepository.save({
          ...clauseData,
          contract,
        })
      )
    );

    // Save risk flags
    const riskFlags = await Promise.all(
      analysis.risks.map(riskData =>
        this.riskFlagRepository.save({
          ...riskData,
          contract,
        })
      )
    );

    // Save summary
    const summary = await this.summaryRepository.save({
      content: analysis.summary,
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

  async getContractQnA(id: string): Promise<QnA[]> {
    const contract = await this.findOne(id);
    return contract.qnas;
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
      contract.fullText
    );

    const qna = await this.qnaRepository.save({
      question,
      answer: answer.answer,
      contract,
    });

    return qna;
  }
} 