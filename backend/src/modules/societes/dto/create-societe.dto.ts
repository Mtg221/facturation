import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

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
}
