export interface StandardClause {
  id?: string;
  [key: string]: any;
}

export interface Contract {
  id: string;
  [key: string]: any;
}

export interface Clause {
  id: string;
  [key: string]: any;
}

export enum RiskFlagStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}
export interface RiskFlag {
  id?: string;
  status?: RiskFlagStatus;
  [key: string]: any;
}

export interface Summary {
  id?: string;
  [key: string]: any;
}

export interface QnA {
  id?: string;
  [key: string]: any;
}

export interface HumanReview {
  id?: string;
  [key: string]: any;
}

export interface Rule {
  id?: string;
  [key: string]: any;
}
