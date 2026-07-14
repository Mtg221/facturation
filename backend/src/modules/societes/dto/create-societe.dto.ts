import { IsString, IsEmail, IsOptional, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSocieteAdminInlineDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  motDePasse: string;

  @IsString()
  @MinLength(2)
  nom: string;

  @IsString()
  @MinLength(2)
  prenom: string;
}

export class CreateSocieteDto {
  @IsString()
  @MinLength(2)
  nom: string;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  ninea?: string;

  @IsOptional()
  @IsString()
  rc?: string;

  @IsOptional()
  @IsString()
  banque?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ValidateNested()
  @Type(() => CreateSocieteAdminInlineDto)
  admin: CreateSocieteAdminInlineDto;
}
