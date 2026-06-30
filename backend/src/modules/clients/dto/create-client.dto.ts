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
  @Matches(/^(\+221|00221)?[789]\d{8}$/, { message: 'Format téléphone Sénégal invalide (+221 7X XXX XX XX)' })
  telephone1?: string;

  @ApiPropertyOptional({ example: '+221 77 123 45 67' })
  @IsOptional()
  @Matches(/^(\+221|00221)?[789]\d{8}$/, { message: 'Format téléphone Sénégal invalide' })
  telephone2?: string;

  @ApiPropertyOptional({ example: '+221 77 123 45 67' })
  @IsOptional()
  @Matches(/^(\+221|00221)?[789]\d{8}$/, { message: 'Format téléphone Sénégal invalide' })
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

  @ApiPropertyOptional({ example: '123456789' })
  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'NINEA doit contenir exactement 9 chiffres' })
  ninea?: string;

  @ApiPropertyOptional({ example: 'SN-DKR-2024-A-12345' })
  @IsOptional()
  @Matches(/^SN-\w+-\d{4}-[A-Z]-\d+$/, { message: 'Format RC invalide (ex: SN-DKR-2024-A-12345)' })
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
