import { ApiProperty } from '@nestjs/swagger';
import {
  SummaryType,
  RiskFlagStatus,
  RiskSeverity,
  RiskType,
  ClauseType,
  ClauseRiskLevel,
} from '@orm/prisma';
import { Type } from 'class-transformer';

export class SummaryDto {
  @ApiProperty({ example: 'summary-uuid', description: 'Summary ID' })
  id: string;

  @ApiProperty({ enum: SummaryType, description: 'Type of summary' })
  type: SummaryType;

  @ApiProperty({ example: 'Summary text', description: 'Summary text' })
  text: string;

  @ApiProperty({
    example: false,
    description: 'Whether the summary is reviewed',
  })
  isReviewed: boolean;

  @ApiProperty({ example: 'Reviewer comments', required: false })
  reviewerComments?: string;

  @ApiProperty({ example: 'contract-uuid', description: 'Contract ID' })
  contractId: string;

  @ApiProperty({ example: 'clause-uuid', required: false })
  clauseId?: string;

  @ApiProperty({ example: '2024-06-01T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-06-01T12:00:00.000Z' })
  updatedAt: string;
}

export class RiskFlagDto {
  @ApiProperty({ example: 'riskflag-uuid', description: 'Risk flag ID' })
  id: string;

  @ApiProperty({ enum: RiskType, description: 'Type of risk' })
  type: RiskType;

  @ApiProperty({ enum: RiskSeverity, description: 'Severity of risk' })
  severity: RiskSeverity;

  @ApiProperty({ example: 'Description of the risk' })
  description: string;

  @ApiProperty({ example: 'Suggested resolution', required: false })
  suggestedResolution?: string;

  @ApiProperty({ example: false })
  isReviewed: boolean;

  @ApiProperty({ example: false })
  isResolved: boolean;

  @ApiProperty({ example: 'Reviewer comments', required: false })
  reviewerComments?: string;

  @ApiProperty({ enum: RiskFlagStatus })
  status: RiskFlagStatus;

  @ApiProperty({ example: 'Some notes' })
  notes: string;

  @ApiProperty({ example: 'analysis-uuid', required: false })
  analysisId?: string;

  @ApiProperty({ example: 0.95, required: false })
  confidence?: number;

  @ApiProperty({ example: 'contract-uuid' })
  contractId: string;

  @ApiProperty({ example: 'clause-uuid', required: false })
  clauseId?: string;

  @ApiProperty({ example: '2024-06-01T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-06-01T12:00:00.000Z' })
  updatedAt: string;
}

export class ClauseDto {
  @ApiProperty({ example: 'clause-uuid', description: 'Clause ID' })
  id: string;

  @ApiProperty({ example: '1.1', description: 'Clause number' })
  number: string;

  @ApiProperty({ example: 'Clause text', description: 'Text of the clause' })
  text: string;

  @ApiProperty({ enum: ClauseType, required: false })
  type?: ClauseType;

  @ApiProperty({ example: false })
  isReviewed: boolean;

  @ApiProperty({ example: false })
  isApproved: boolean;

  @ApiProperty({ example: 'Suggested text', required: false })
  suggestedText?: string;

  @ApiProperty({ example: 'contract-uuid' })
  contractId: string;

  @ApiProperty({ example: 'analysis-uuid', required: false })
  analysisId?: string;

  @ApiProperty({ example: 0, required: false })
  startIndex?: number;

  @ApiProperty({ example: 10, required: false })
  endIndex?: number;

  @ApiProperty({ example: 'Title', required: false })
  title?: string;

  @ApiProperty({ example: 'Classification', required: false })
  classification?: string;

  @ApiProperty({ enum: ClauseRiskLevel, required: false })
  riskLevel?: ClauseRiskLevel;

  @ApiProperty({ example: 'Justification', required: false })
  riskJustification?: string;

  @ApiProperty({ example: 'Entity1,Entity2', required: false })
  entities?: string;

  @ApiProperty({ example: '100,200', required: false })
  amounts?: string;

  @ApiProperty({ example: '2024-06-01,2024-07-01', required: false })
  dates?: string;

  @ApiProperty({ example: 'Section 1.1,Section 2.1', required: false })
  legalReferences?: string;

  @ApiProperty({ example: 'Obligation', required: false })
  obligation?: string;

  @ApiProperty({ example: 0.95, required: false })
  confidence?: number;

  @ApiProperty({ example: '2024-06-01T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-06-01T12:00:00.000Z' })
  updatedAt: string;
}

export class AnalysisResultDto {
  @ApiProperty({
    type: [SummaryDto],
    description: 'Array of contract summaries',
  })
  @Type(() => SummaryDto)
  summaries: SummaryDto[];

  @ApiProperty({
    type: [RiskFlagDto],
    description: 'Array of contract risk flags',
  })
  @Type(() => RiskFlagDto)
  riskFlags: RiskFlagDto[];

  @ApiProperty({ type: [ClauseDto], description: 'Array of contract clauses' })
  @Type(() => ClauseDto)
  clauses: ClauseDto[];
}
