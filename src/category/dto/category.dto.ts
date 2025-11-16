import { IsOptional } from 'class-validator';

export class GetProductsByCategoryDto {
  @IsOptional() //check if the status is a valid enum value
  categoryId?: number;
}

export class CategoryDto {
  id: number;
  title: string;
  description: string | null;
}
export class CreateCategoryDto {
  title: string;
  description: string;
}
