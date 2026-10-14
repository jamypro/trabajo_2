import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RegisterDto } from '../../auth/dto/register.dto';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto extends RegisterDto {
  @ApiPropertyOptional({
    enum: Role,
    default: Role.USUARIO,
    description: 'Rol del usuario (solo ADMIN puede asignarlo)',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser ADMIN o USUARIO' })
  role?: Role;
}
