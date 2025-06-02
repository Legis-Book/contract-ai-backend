import { z } from 'zod';

const ClauseTypeEnum = z.enum([
  'TERM', // governing term / duration
  'TERMINATION', // rights to exit
  'PAYMENT', // commercial payment terms
  'CONFIDENTIALITY',
  'INDEMNIFICATION',
  'LIABILITY',
  'GOVERNING_LAW',
  'INTELLECTUAL_PROPERTY',
  'DISPUTE_RESOLUTION',
  'FORCE_MAJEURE',
  'ASSIGNMENT',
  'NOTICES',
  'SEVERABILITY',
  'ENTIRE_AGREEMENT',
  'AMENDMENT',
  'WAIVER',
  'COUNTERPARTS',
  'HEADINGS',
  'DEFINITIONS',
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
  'MISSING_CLAUSE',
  'DEVIATION',
  'COMPLIANCE_ISSUE',
  'AMBIGUOUS_LANGUAGE',
  'UNFAIR_TERMS',
  'DATA_PROTECTION',
  'INTELLECTUAL_PROPERTY',
  'LIABILITY',
  'TERMINATION',
  'OTHER',
]);

const SeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const ClauseSchema = z.object({
  id: z.string().optional(), // uuid for DB compatibility
  clauseNumber: z
    .string()
    .optional()
    .describe('Clause number (e.g. "1.1" or "1.2.1")'),
  title: z.string().optional().describe('Title of the clause'),
  text: z.string().describe('Text of the clause'),
  type: ClauseTypeEnum.optional().describe('Type of clause'),
  classification: z
    .string()
    .optional()
    .describe('Classification of the clause (e.g. "Service" or "SLA")'),
  riskLevel: z
    .enum(['LOW', 'MEDIUM', 'HIGH'])
    .optional()
    .describe('Risk level of the clause (e.g. "Low", "Medium", "High")'),
  riskJustification: z
    .string()
    .optional()
    .describe('Justification for the risk level'),
  entities: z
    .array(z.string())
    .optional()
    .describe(
      'Entities referenced in the clause (e.g. "Customer", "Supplier")',
    ),
  amounts: z
    .array(z.string())
    .optional()
    .describe('Amounts referenced in the clause (e.g. "100", "1000")'),
  dates: z
    .array(z.string())
    .optional()
    .describe(
      'Dates referenced in the clause (e.g. "2025-01-01", "2025-01-01")',
    ),
  legalReferences: z
    .array(z.string())
    .optional()
    .describe(
      'Legal references referenced in the clause (e.g. "Section 1.1", "Section 1.2.1")',
    ),
  obligation: ObligationEnum.optional().describe(
    'Obligation of the clause (e.g. "Right", "Obligation", "Condition", "Representation")',
  ),
  startIndex: z
    .number()
    .int()
    .optional()
    .describe('Start index of the clause in the document'),
  endIndex: z
    .number()
    .int()
    .optional()
    .describe('End index of the clause in the document'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe(
      'Confidence in the clause (e.g. 0.95) - 0 is lowest, 1 is highest',
    ),
});

const RiskSchema = z.object({
  id: z.string().optional(), // uuid for DB compatibility
  clauseNumber: z
    .string()
    .optional()
    .describe('Clause number of the risk (e.g. "1.1" or "1.2.1")'),
  type: RiskTypeEnum.describe(
    'Normalized risk bucket (e.g. "COMPLIANCE", "FINANCIAL", "LEGAL", "OPERATIONAL", "REPUTATIONAL", "MISSING_CLAUSE", "DEVIATION", "COMPLIANCE_ISSUE", "AMBIGUOUS_LANGUAGE", "UNFAIR_TERMS", "DATA_PROTECTION", "INTELLECTUAL_PROPERTY", "LIABILITY", "TERMINATION", "OTHER")',
  ),
  description: z.string().describe('Human-readable explanation of the risk'),
  severity: SeverityEnum.describe('Impact x likelihood'),
  suggestedResolution: z
    .string()
    .describe(
      'Suggested resolution for the risk (e.g. "Add a clause to the contract")',
    ),
  status: z.enum(['OPEN', 'CLOSED']).describe('Status of the risk'),
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
