import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users/user.entity';
import { Account } from './accounts/account.entity';
import { Transaction } from './transactions/transaction.entity';
import { Role } from './common/enums/role.enum';

async function seed(): Promise<void> {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'root',
    database: process.env.DB_DATABASE ?? 'payflow',
    entities: [User, Account, Transaction],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
  });

  await dataSource.initialize();

  try {
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@payflow.com';
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

    const userRepository = dataSource.getRepository(User);
    const existing = await userRepository.findOneBy({ email });

    if (existing) {
      console.log(`El usuario ADMIN ya existe (${email}). No se realizaron cambios.`);
      return;
    }

    const account = new Account();
    account.balance = 0;

    const admin = new User();
    admin.name = 'Administrador';
    admin.email = email;
    admin.password = await bcrypt.hash(password, 10);
    admin.role = Role.ADMIN;
    admin.account = account;

    await userRepository.save(admin);
    console.log(`Usuario ADMIN creado correctamente (${email}).`);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Error al ejecutar el seed:', error);
  process.exit(1);
});
