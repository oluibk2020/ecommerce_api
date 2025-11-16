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

  @IsNotEmpty()
  page: number = 1;

  @IsNotEmpty()
  limit: number = 5;
}
