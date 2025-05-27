import { z } from 'zod';

export const ClauseSchema = z.object({
  title: z.string(),
  type: z.string(),
  text: z.string(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  riskJustification: z.string().optional(),
  entities: z.array(z.string()).optional(),
  amounts: z.array(z.string()).optional(),
  dates: z.array(z.string()).optional(),
  legalReferences: z.array(z.string()).optional(),
  obligation: z.string().optional(),
  startIndex: z.number().int().optional(),
  endIndex: z.number().int().optional(),
  confidence: z.number().min(0).max(1).optional(),
});
