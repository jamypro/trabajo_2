import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { Account } from './account.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Cuentas')
@ApiBearerAuth()
@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todas las cuentas (solo ADMIN)' })
  findAll(): Promise<Account[]> {
    return this.accountsService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Consultar la cuenta del usuario autenticado' })
  getMyAccount(@CurrentUser('sub') userId: string): Promise<Account> {
    return this.accountsService.findByUserId(userId);
  }
}
