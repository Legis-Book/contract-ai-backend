import { z } from 'zod';

const ClauseTypeEnum = z.enum([
  'TERM', // governing term / duration
  'TERMINATION', // rights to exit
  'PAYMENT', // commercial payment terms
  'IP', // intellectual-property
  'CONFIDENTIALITY',
  'INDEMNITY',
  'LIMITATION_OF_LIABILITY',
  'GOVERNING_LAW',
  'OTHER', // fall-back
]);

const ObligationEnum = z.enum([
  'RIGHT',
  'OBLIGATION',
  'CONDITION',
  'REPRESENTATION',
]);

const RiskTypeEnum = z.enum([
  'COMPLIANCE',
  'FINANCIAL',
  'LEGAL',
  'OPERATIONAL',
  'REPUTATIONAL',
  'OTHER',
]);

const SeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const ClauseSchema = z.object({
  id: z.string(), // uuid for DB compatibility
  clauseNumber: z.string().optional(),
  title: z.string().optional(),
  text: z.string(),
  type: ClauseTypeEnum.optional(),
  classification: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  riskJustification: z.string().optional(),
  entities: z.array(z.string()).optional(),
  amounts: z.array(z.string()).optional(),
  dates: z.array(z.string()).optional(),
  legalReferences: z.array(z.string()).optional(),
  obligation: ObligationEnum.optional(),
  startIndex: z.number().int().optional(),
  endIndex: z.number().int().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const RiskSchema = z.object({
  id: z
    .number()
    .int()
    .describe('Running index starting at 1, unique within the section'),
  clauseId: z
    .number()
    .int()
    .describe('ID of the clause this risk relates to (or 0 if section-level)'),
  type: RiskTypeEnum.describe('Normalized risk bucket'),
  description: z.string().describe('Human-readable explanation of the risk'),
  severity: SeverityEnum.describe('Impact x likelihood'),
  mitigation: z
    .string()
    .describe('Concise, actionable mitigation recommendation (<=120 chars)'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Model confidence that the risk is correctly identified (0-1)'),
});

const AnalysisSchema = z.object({
  sectionTitle: z
    .string()
    .describe(
      'Heading of the section being analysed, if identifiable, else ""',
    ),
  clauses: z.array(ClauseSchema).describe('All clauses in reading order'),
  risks: z.array(RiskSchema).describe('All risks (may reference clauses)'),
});

export { ClauseSchema, RiskSchema, AnalysisSchema };
