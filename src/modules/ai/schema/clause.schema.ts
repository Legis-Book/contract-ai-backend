import { z } from 'zod';

export const ClauseSchema = z.object({
  title: z.string(),
  clauseType: z.string(),
  text: z.string(),
  riskScore: z.enum(['Low', 'Medium', 'High']),
  riskJustification: z.string(),
  entities: z.array(z.string()).optional(),
  amounts: z.array(z.string()).optional(),
  dates: z.array(z.string()).optional(),
  legalReferences: z.array(z.string()).optional(),
});
