import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractService } from './contract.service';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdateRiskFlagDto } from './dto/update-risk-flag.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import type { ExportAnalysisResult } from './contract.service';
import { ContractHybridService } from './contract-hybrid.service';
import { IngestContractDto } from './dto/ingest-contract.dto';
import { AnalysisResultDto } from './dto/analysis-result.dto';

@ApiTags('contracts')
@Controller('contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly contractHybridService: ContractHybridService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a contract file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        contractType: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('contractType') contractType: string,
  ) {
    const contract = await this.contractService.uploadContract(
      file,
      contractType,
    );
    return { id: contract.id };
  }

  @Get()
  @ApiOperation({ summary: 'Get all contracts' })
  @ApiResponse({ status: 200, description: 'Return all contracts' })
  findAll() {
    return this.contractService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contract by id' })
  @ApiResponse({ status: 200, description: 'Return the contract' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contract' })
  @ApiResponse({ status: 200, description: 'Contract updated successfully' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    return this.contractService.update(id, updateContractDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contract' })
  @ApiResponse({ status: 200, description: 'Contract deleted successfully' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  remove(@Param('id') id: string) {
    return this.contractService.remove(id);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Analyze a contract using AI' })
  @ApiResponse({ status: 200, description: 'Contract analysis completed' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  analyzeContract(@Param('id') id: string) {
    return this.contractService.analyzeContract(id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get contract summaries' })
  @ApiResponse({ status: 200, description: 'Return contract summaries' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  getContractSummary(@Param('id') id: string) {
    return this.contractService.getContractSummary(id);
  }

  @Get(':id/risks')
  @ApiOperation({ summary: 'Get contract risks' })
  @ApiResponse({ status: 200, description: 'Return contract risks' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  getContractRisks(@Param('id') id: string) {
    return this.contractService.getContractRisks(id);
  }

  @Get(':id/analysis')
  @ApiOperation({ summary: 'Get full contract analysis' })
  @ApiResponse({
    status: 200,
    description: 'Return analysis data',
    type: AnalysisResultDto,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  async getAnalysis(@Param('id') id: string): Promise<AnalysisResultDto> {
    const result = await this.contractService.getAnalysis(id);
    return {
      summaries: result.summaries.map((s) => ({
        ...s,
        reviewerComments: s.reviewerComments ?? undefined,
        contractId: s.contractId ?? undefined,
        clauseId: undefined,
        createdAt:
          s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
        updatedAt:
          s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
      })),
      riskFlags: result.riskFlags.map((r) => ({
        ...r,
        suggestedResolution: r.suggestedResolution ?? undefined,
        reviewerComments: r.reviewerComments ?? undefined,
        analysisId: r.analysisId ?? undefined,
        confidence: r.confidence ?? undefined,
        clauseId: r.clauseId ?? undefined,
        createdAt:
          r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
        updatedAt:
          r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      })),
      clauses: result.clauses.map((c) => ({
        ...c,
        type: c.type ?? undefined,
        suggestedText: c.suggestedText ?? undefined,
        analysisId: c.analysisId ?? undefined,
        startIndex: c.startIndex ?? undefined,
        endIndex: c.endIndex ?? undefined,
        title: c.title ?? undefined,
        classification: c.classification ?? undefined,
        riskLevel: c.riskLevel ?? undefined,
        riskJustification: c.riskJustification ?? undefined,
        entities: c.entities ?? undefined,
        amounts: c.amounts ?? undefined,
        dates: c.dates ?? undefined,
        legalReferences: c.legalReferences ?? undefined,
        obligation: c.obligation ?? undefined,
        confidence: c.confidence ?? undefined,
        createdAt:
          c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        updatedAt:
          c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
      })),
    };
  }

  @Get(':id/qna')
  @ApiOperation({ summary: 'Get contract Q&A' })
  @ApiResponse({ status: 200, description: 'Return contract Q&A' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  getContractQnA(@Param('id') id: string) {
    return this.contractService.getContractQnA(id);
  }

  @Post(':id/qna')
  @ApiOperation({ summary: 'Ask a question about the contract' })
  @ApiResponse({ status: 200, description: 'Question answered successfully' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  askQuestion(@Param('id') id: string, @Body('question') question: string) {
    return this.contractService.askQuestion(id, question);
  }

  @Post(':id/chat')
  @ApiOperation({ summary: 'Submit a chat question' })
  @ApiResponse({ status: 200, description: 'Chat answered' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  submitChat(@Param('id') id: string, @Body('question') question: string) {
    return this.contractService.submitChat(id, question);
  }

  @Get(':id/chat')
  @ApiOperation({ summary: 'Get chat history' })
  @ApiResponse({ status: 200, description: 'Return chat messages' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  getChat(@Param('id') id: string) {
    return this.contractService.getContractChat(id);
  }

  @Patch(':id/risk-flags/:riskId')
  @ApiOperation({ summary: 'Update risk flag status' })
  @ApiResponse({ status: 200, description: 'Risk flag updated' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiParam({
    name: 'riskId',
    type: String,
    description: 'Risk ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  updateRiskFlag(
    @Param('id') id: string,
    @Param('riskId') riskId: string,
    @Body() body: UpdateRiskFlagDto,
  ) {
    return this.contractService.updateRiskFlag(
      id,
      riskId,
      body.status,
      body.notes,
    );
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export contract analysis' })
  @ApiResponse({ status: 200, description: 'Return analysis export' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  exportAnalysis(@Param('id') id: string): Promise<ExportAnalysisResult> {
    return this.contractService.exportAnalysis(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get contract reviews' })
  @ApiResponse({ status: 200, description: 'Return contract reviews' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  getContractReviews(@Param('id') id: string) {
    return this.contractService.getContractReviews(id);
  }

  @Post(':id/hybrid-ingest')
  @ApiOperation({ summary: 'Ingest a contract using hybrid AI' })
  @ApiResponse({ status: 200, description: 'Contract ingested successfully' })
  @ApiConsumes('application/json')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiParam({
    name: 'body',
    type: IngestContractDto,
    description: 'Contract ingestion data',
    required: true,
  })
  async hybridIngest(
    @Param('id') contractId: string,
    @Body() body: IngestContractDto,
  ) {
    const text = await this.contractHybridService.extractText(body.sources);
    const clauses = await this.contractHybridService.extractClauses(
      text,
      body.contractType,
    );
    await this.contractHybridService.saveContract(
      contractId,
      body.title,
      clauses,
    );
    return { clauseCount: clauses.length };
  }

  @Get(':id/hybrid-search')
  @ApiOperation({ summary: 'Search contract clauses using hybrid AI' })
  @ApiResponse({ status: 200, description: 'Return contract clauses' })
  @ApiParam({
    name: 'q',
    type: String,
    description: 'Search query',
    required: true,
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Contract ID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  async hybridSearch(@Query('q') q: string) {
    return this.contractHybridService.searchClauses(q);
  }
}
