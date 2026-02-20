import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryProductDto {
  @IsOptional()
  name: string;

  @IsOptional()
  categoryId: string;

  @IsOptional()
  // @IsNotEmpty()
  minPrice: string;

  @IsOptional()
  // @IsNotEmpty()
  maxPrice: string;

  @IsOptional()
  isFeatured: string;

  @IsOptional()
  page: number = 1;

  @IsOptional()
  limit: number = 20;
}
