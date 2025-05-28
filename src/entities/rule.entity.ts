export interface Rule {
  id?: string;
  name: string;
  similarityThreshold?: number;
  deviationAllowedPct?: number;
}
