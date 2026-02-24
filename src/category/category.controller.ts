import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CategoryService } from './category.service';
import { FullProductDto } from 'src/product/dto/product.dto';
import { CategoryDto, CreateCategoryDto } from './dto/category.dto';
import { AdminOnly } from 'src/auth/guards/admin-decorator';
@Controller('category')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('/:id')
  async getProductsByCategoryId(
    @Param('id') id: string,
  ): Promise<FullProductDto[]> {
    return this.categoryService.fetchProductsByCategoryId(id);
  }

  @Get()
  async fetchAllCategories(): Promise<CategoryDto[]> {
    return this.categoryService.fetchAllCategories();
  }

  @AdminOnly()
  @Post()
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }
}
