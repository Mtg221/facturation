import {
  IsString, IsDateString, IsOptional, IsArray, IsNumber,
  Min, Max, ValidateNested, IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DetailFactureDto {
  @ApiPropertyOptional({ description: 'ID du produit (optionnel, pour ligne libre)' })
  @IsOptional()
  @IsString()
  produitId?: string;

  @ApiProperty()
  @IsString()
  designation: string;

  @ApiPropertyOptional({ description: 'Observation libre sur la ligne' })
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantite: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prixUnitaire: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  tva?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  remise?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ordre?: number;
}

export class CreateFactureDto {
  @ApiProperty()
  @IsString()
  clientId: string;

  @ApiProperty()
  @IsDateString()
  dateEcheance: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateEmission?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  remiseGlobale?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conditionsPaiement?: string;

  @ApiProperty({ type: [DetailFactureDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetailFactureDto)
  details: DetailFactureDto[];
}
