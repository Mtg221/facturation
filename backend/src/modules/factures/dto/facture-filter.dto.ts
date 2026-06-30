import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutFacture } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FactureFilterDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ enum: StatutFacture })
  @IsOptional()
  @IsEnum(StatutFacture)
  statut?: StatutFacture;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFin?: string;
}
