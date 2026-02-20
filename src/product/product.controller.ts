import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Request } from 'express';

import { Logger } from '@nestjs/common';

import { AdminOnly } from 'src/auth/guards/admin-decorator';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  FeaturedProductWithIdDto,
  ProductDto,
  ProductWithIdDto,
} from './dto/product.dto';
import { QueryProductDto } from './dto/query-products.dto';
import { ResponseMessage } from 'src/helpers/message.interface';

@Controller('product')
export class ProductController {
  private logger = new Logger('ProductController');
  constructor(private productService: ProductService) {}

  @AdminOnly()
  @Post('/create')
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ResponseMessage> {
    return this.productService.createProduct(createProductDto);
  }

  @AdminOnly()
  @Patch('/update/:id')
  async updateProduct(
    @Body() productDto: ProductDto,
    @Param('id') id: string,
  ): Promise<ResponseMessage> {
    return this.productService.editProduct(productDto, id);
  }

  @AdminOnly()
  @Delete('/delete/:productId')
  async deleteProduct(
    @Param('productId') productId: string,
  ): Promise<ResponseMessage> {
    return this.productService.deleteProductById(Number(productId));
  }

  @Get('/s')
  async queryProducts(@Query() queryProductDto: QueryProductDto): Promise<{
    products: ProductWithIdDto[];
    meta: { totalPages: number; totalProducts: number; lastPage: number };
  }> {
    return this.productService.queryProducts(queryProductDto);
  }

  // @Get()
  // async getAllProducts(): Promise<{
  //   data: ProductWithIdDto[];
  //   meta: { total: number; lastPage: number; page: number };
  // }> {
  //   return this.productService.getAllProducts();
  // }

  // @Get('/featured')
  // async getAllFeaturedProducts(): Promise<{
  //   data: FeaturedProductWithIdDto[];
  //   meta: { total: number; lastPage: number; page: number };
  // }> {
  //   return this.productService.getAllFeaturedProducts();
  // }

  @Get('/:id')
  async getProductById(@Param('id') id: string): Promise<ProductWithIdDto> {
    return this.productService.getProductById(Number(id));
  }
}
