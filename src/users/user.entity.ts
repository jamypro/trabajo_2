import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Account } from '../accounts/account.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USUARIO,
  })
  role: Role;

  @OneToOne(() => Account, (account) => account.user, { cascade: true })
  account: Account;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
