import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    example: 250.0,
    description: 'Monto a transferir (debe ser mayor a 0)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID de la cuenta destino de la transferencia',
  })
  @IsUUID('4', { message: 'El ID de cuenta destino no es válido' })
  destinationAccountId: string;
}
