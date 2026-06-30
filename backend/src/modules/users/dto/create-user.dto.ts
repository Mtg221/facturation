import { IsEmail, IsString, IsEnum, IsOptional, MinLength, Validate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StrongPasswordConstraint } from '../../common/validators/strong-password.validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  nom: string;

  @ApiProperty()
  @IsString()
  prenom: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @Validate(StrongPasswordConstraint)
  motDePasse: string;

  @ApiPropertyOptional({ enum: Role, default: Role.LECTURE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephone?: string;
}
