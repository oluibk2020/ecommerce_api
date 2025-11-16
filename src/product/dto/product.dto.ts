import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ProductDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  cost: number;
}

export class ProductWithIdDto extends ProductDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}

export class ProductWithImageDto extends ProductDto {
  @IsNotEmpty()
  @IsString()
  imageUrl: string;
}
export class ProductWithImageAndIdDto extends ProductWithImageDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class FeaturedProductWithIdDto extends ProductWithIdDto {
  @IsBoolean()
  featured: boolean;
}

export class CreateProductDto extends ProductWithImageDto {
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsBoolean()
  featured: boolean;
}

export class FullProductDto extends CreateProductDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  createdAt: Date;
  updatedAt: Date | null;
}
