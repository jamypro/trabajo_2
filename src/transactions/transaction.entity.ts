import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { Account } from '../accounts/account.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @ManyToOne(() => Account, (account) => account.outgoingTransactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount: Account | null;

  @Column({ name: 'source_account_id', type: 'varchar', nullable: true })
  sourceAccountId: string | null;

  @ManyToOne(() => Account, (account) => account.incomingTransactions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount: Account | null;

  @Column({ name: 'destination_account_id', type: 'varchar', nullable: true })
  destinationAccountId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
