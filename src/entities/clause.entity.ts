import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Contract } from './contract.entity';
import { RiskFlag } from './risk-flag.entity';

@Entity('clauses')
export class Clause {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clauseNumber: string;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  classification: string;

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    nullable: true,
  })
  riskLevel: string;

  @Column({ nullable: true, type: 'text' })
  riskJustification: string;

  @Column({ nullable: true })
  obligation: string;

  @Column({ nullable: true, type: 'simple-array' })
  entities: string[];

  @Column({ nullable: true, type: 'simple-array' })
  amounts: string[];

  @Column({ nullable: true, type: 'simple-array' })
  dates: string[];

  @Column({ nullable: true, type: 'simple-array' })
  legalReferences: string[];

  @Column({ nullable: true, type: 'int' })
  startIndex: number;

  @Column({ nullable: true, type: 'int' })
  endIndex: number;

  @Column({ nullable: true, type: 'float' })
  confidence: number;

  @ManyToOne(() => Contract, (contract) => contract.clauses)
  contract: Contract;

  @OneToMany(() => RiskFlag, (riskFlag) => riskFlag.clause)
  riskFlags: RiskFlag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
