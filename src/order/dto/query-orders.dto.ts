import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryOrderDto {
  @IsOptional()
  page: number = 1;

  @IsOptional()
  limit: number = 20;
}
