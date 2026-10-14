import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Transacciones')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('deposit')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Realizar un depósito (solo ADMIN)' })
  deposit(@Body() dto: DepositDto): Promise<Transaction> {
    return this.transactionsService.deposit(dto);
  }

  @Post('withdraw')
  @Roles(Role.USUARIO)
  @ApiOperation({ summary: 'Realizar un retiro desde la cuenta propia (USUARIO)' })
  withdraw(
    @CurrentUser('sub') userId: string,
    @Body() dto: WithdrawDto,
  ): Promise<Transaction> {
    return this.transactionsService.withdraw(userId, dto);
  }

  @Post('transfer')
  @Roles(Role.USUARIO)
  @ApiOperation({ summary: 'Transferir a otra cuenta (USUARIO)' })
  transfer(
    @CurrentUser('sub') userId: string,
    @Body() dto: TransferDto,
  ): Promise<Transaction> {
    return this.transactionsService.transfer(userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Historial general de transacciones (solo ADMIN)' })
  findAll(): Promise<Transaction[]> {
    return this.transactionsService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Historial de transacciones del usuario autenticado' })
  findMine(@CurrentUser('sub') userId: string): Promise<Transaction[]> {
    return this.transactionsService.findByUserId(userId);
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Historial de transacciones de un usuario (solo ADMIN)' })
  findByUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<Transaction[]> {
    return this.transactionsService.findByUserId(userId);
  }
}
