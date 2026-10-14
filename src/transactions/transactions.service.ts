import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { Account } from '../accounts/account.entity';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { TransactionType } from '../common/enums/transaction-type.enum';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async deposit(dto: DepositDto): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await this.lockAccount(queryRunner, dto.accountId);

      account.balance = this.round(account.balance + dto.amount);
      await queryRunner.manager.save(account);

      const transaction = queryRunner.manager.create(Transaction, {
        type: TransactionType.DEPOSITO,
        amount: dto.amount,
        destinationAccountId: account.id,
        sourceAccountId: null,
      });

      const saved = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return this.findTransactionWithRelations(saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async withdraw(userId: string, dto: WithdrawDto): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await this.lockAccountByUser(queryRunner, userId);

      if (account.balance < dto.amount) {
        throw new BadRequestException('Fondos insuficientes');
      }

      account.balance = this.round(account.balance - dto.amount);
      await queryRunner.manager.save(account);

      const transaction = queryRunner.manager.create(Transaction, {
        type: TransactionType.RETIRO,
        amount: dto.amount,
        sourceAccountId: account.id,
        destinationAccountId: null,
      });

      const saved = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return this.findTransactionWithRelations(saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async transfer(userId: string, dto: TransferDto): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sourceAccount = await this.lockAccountByUser(queryRunner, userId);

      if (sourceAccount.id === dto.destinationAccountId) {
        throw new BadRequestException(
          'No se puede transferir a la misma cuenta de origen',
        );
      }

      const destinationAccount = await this.lockAccount(
        queryRunner,
        dto.destinationAccountId,
      );

      if (sourceAccount.balance < dto.amount) {
        throw new BadRequestException('Fondos insuficientes');
      }

      sourceAccount.balance = this.round(sourceAccount.balance - dto.amount);
      destinationAccount.balance = this.round(
        destinationAccount.balance + dto.amount,
      );

      await queryRunner.manager.save(sourceAccount);
      await queryRunner.manager.save(destinationAccount);

      const transaction = queryRunner.manager.create(Transaction, {
        type: TransactionType.TRANSFERENCIA,
        amount: dto.amount,
        sourceAccountId: sourceAccount.id,
        destinationAccountId: destinationAccount.id,
      });

      const saved = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return this.findTransactionWithRelations(saved.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      relations: {
        sourceAccount: { user: true },
        destinationAccount: { user: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const account = await this.dataSource
      .getRepository(Account)
      .findOne({ where: { user: { id: userId } } });

    if (!account) {
      throw new NotFoundException('No se encontró una cuenta para el usuario');
    }

    return this.transactionsRepository.find({
      where: [
        { sourceAccountId: account.id },
        { destinationAccountId: account.id },
      ],
      relations: {
        sourceAccount: { user: true },
        destinationAccount: { user: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  private async lockAccount(
    queryRunner: QueryRunner,
    accountId: string,
  ): Promise<Account> {
    const account = await queryRunner.manager
      .getRepository(Account)
      .createQueryBuilder('account')
      .setLock('pessimistic_write')
      .where('account.id = :id', { id: accountId })
      .getOne();

    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    return account;
  }

  private async lockAccountByUser(
    queryRunner: QueryRunner,
    userId: string,
  ): Promise<Account> {
    const account = await queryRunner.manager
      .getRepository(Account)
      .createQueryBuilder('account')
      .innerJoin('account.user', 'user')
      .setLock('pessimistic_write')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!account) {
      throw new NotFoundException(
        'No se encontró una cuenta asociada al usuario',
      );
    }

    return account;
  }

  private async findTransactionWithRelations(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: {
        sourceAccount: { user: true },
        destinationAccount: { user: true },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }

    return transaction;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
