import { IsEmail, IsString, IsEnum, IsOptional, MinLength, Validate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StrongPasswordConstraint } from '../../../common/validators/strong-password.validator';

export class RegisterDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty()
  @IsString()
  nom: string;

  @ApiProperty()
  @IsString()
  prenom: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Validate(StrongPasswordConstraint)
  motDePasse: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
