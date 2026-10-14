import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Account } from '../accounts/account.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly dataSource: DataSource,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const role: Role = dto.role ?? Role.USUARIO;

    const existing = await this.usersRepository.findOneBy({
      email: dto.email,
    });
    if (existing) {
      throw new ConflictException('El correo ya se encuentra registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.dataSource.transaction(async (manager) => {
      const account = manager.create(Account, { balance: 0 });

      const user = manager.create(User, {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role,
        account,
      });

      const savedUser = await manager.save(user);

      return this.findUserById(savedUser.id, manager);
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { account: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: { account: true },
      order: { createdAt: 'DESC' },
    });
  }

  private async findUserById(
    id: string,
    manager: EntityManager,
  ): Promise<User> {
    const user = await manager.findOne(User, {
      where: { id },
      relations: { account: true },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }
}
