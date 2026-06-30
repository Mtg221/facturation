import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModePaiement } from '@prisma/client';

export class CreatePaiementDto {
  @ApiProperty()
  @IsString()
  factureId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  montant: number;

  @ApiProperty({ enum: ModePaiement })
  @IsEnum(ModePaiement)
  mode: ModePaiement;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  datePaiement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  numeroCheque?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  banque?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commentaire?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recuPar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payePar?: string;
}
