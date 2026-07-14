import { IsString, IsEmail, IsOptional, IsArray, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty()
  @IsString()
  nom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+221 77 123 45 67' })
  @IsOptional()
  @Matches(/^[+\d][\d\s().-]{5,19}$/, { message: 'Format téléphone invalide' })
  telephone1?: string;

  @ApiPropertyOptional({ example: '+221 77 123 45 67' })
  @IsOptional()
  @Matches(/^[+\d][\d\s().-]{5,19}$/, { message: 'Format téléphone invalide' })
  telephone2?: string;

  @ApiPropertyOptional({ example: '+221 77 123 45 67' })
  @IsOptional()
  @Matches(/^[+\d][\d\s().-]{5,19}$/, { message: 'Format téléphone invalide' })
  telephone3?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ default: 'Sénégal' })
  @IsOptional()
  @IsString()
  pays?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  localisation?: string;

  @ApiPropertyOptional({ example: '123456789 2G3' })
  @IsOptional()
  @Matches(/^[\w\s-]{5,20}$/, { message: 'NINEA invalide (5 à 20 caractères alphanumériques)' })
  ninea?: string;

  @ApiPropertyOptional({ example: 'SN-DKR-2024-A-12345' })
  @IsOptional()
  @Matches(/^[\w\s-]{3,30}$/, { message: 'Format RC invalide' })
  rc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs des secteurs d\'activité' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secteurIds?: string[];
}
