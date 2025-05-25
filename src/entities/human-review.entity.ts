import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Contract } from './contract.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';

@Entity('human_reviews')
export class HumanReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['PENDING_REVIEW', 'REVIEWED_CHANGES', 'APPROVED', 'REJECTED'],
    default: 'PENDING_REVIEW',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @ManyToOne(() => Contract, (contract) => contract.reviews)
  contract: Contract;

  @ManyToOne(() => UserEntity, (user) => user.reviews)
  reviewer: UserEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
