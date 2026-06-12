import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { FullProductDto } from 'src/product/dto/product.dto';
import { CategoryDto, CreateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async fetchProductsByCategoryId(id: string): Promise<FullProductDto[]> {
    //get total number of categories
    const count = await this.prisma.category.count();

    if (Number(id) > count) {
      const found = await this.prisma.product.findMany();
      return found;
    }

    const found = await this.prisma.product.findMany({
      where: {
        categoryId: Number(id),
      },
    });

    //if not found, return an error of 404
    if (!found) {
      throw new NotFoundException(
        `Products with category ID "${id}" not found`,
      );
    }

    return found;
  }

  async fetchAllCategories(): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        description: true,
        title: true,
      },
    });

    if (!categories) {
      throw new NotFoundException('No category found');
    }

    return categories;
  }

  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    const { title, description } = createCategoryDto;
    const formatTitle = title.toLowerCase();
    const formatDescription = description.toLowerCase();
    const category = await this.prisma.category.create({
      data: {
        title: formatTitle,
        description: formatDescription,
      },
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    return category;
  }
}
