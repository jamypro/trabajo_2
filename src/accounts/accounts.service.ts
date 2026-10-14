import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async findById(id: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }
    return account;
  }

  async findByUserId(userId: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });
    if (!account) {
      throw new NotFoundException(
        'No se encontró una cuenta asociada al usuario',
      );
    }
    return account;
  }

  async findAll(): Promise<Account[]> {
    return this.accountsRepository.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }
}
