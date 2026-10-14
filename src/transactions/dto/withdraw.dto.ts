import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({
    example: 100.0,
    description: 'Monto a retirar de la cuenta propia (debe ser mayor a 0)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount: number;
}
