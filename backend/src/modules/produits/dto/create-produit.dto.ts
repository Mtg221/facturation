import { IsString, IsNumber, IsOptional, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProduitDto {
  @ApiProperty()
  @IsString()
  reference: string;

  @ApiProperty()
  @IsString()
  designation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  prix: number;

  @ApiPropertyOptional({ default: 18, description: 'Taux TVA en pourcentage' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  tva?: number;

  @ApiPropertyOptional({ default: 'unité' })
  @IsOptional()
  @IsString()
  unite?: string;
}
