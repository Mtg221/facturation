import { IsOptional, IsPositive, IsString, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'nom',
  'prenom',
  'email',
  'numero',
  'code',
  'dateEmission',
  'dateEcheance',
  'montantTTC',
  'montantHT',
  'montantTVA',
  'statut',
  'isActive',
] as const;

export type AllowedSortField = (typeof ALLOWED_SORT_FIELDS)[number];

export const ALLOWED_SORT_ORDERS = ['asc', 'desc'] as const;
export type AllowedSortOrder = (typeof ALLOWED_SORT_ORDERS)[number];

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ALLOWED_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(ALLOWED_SORT_FIELDS)
  sortBy?: AllowedSortField = 'createdAt';

  @ApiPropertyOptional({ enum: ALLOWED_SORT_ORDERS, default: 'desc' })
  @IsOptional()
  @IsIn(ALLOWED_SORT_ORDERS)
  sortOrder?: AllowedSortOrder = 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// Helper to get validated sort options
export function getValidatedSortOptions(pagination: PaginationDto): Record<string, 'asc' | 'desc'> {
  return { [pagination.sortBy]: pagination.sortOrder };
}
