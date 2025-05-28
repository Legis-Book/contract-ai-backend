export enum RiskFlagStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}
export class RiskFlag {
  id!: string;
  status?: RiskFlagStatus;
  [key: string]: any;
}
