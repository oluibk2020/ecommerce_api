import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  FeaturedProductWithIdDto,
  ProductDto,
  ProductWithIdDto,
} from './dto/product.dto';
import { QueryProductDto } from './dto/query-products.dto';
import { Message, ResponseMessage } from 'src/helpers/message.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProductService {
  private readonly PRODUCT_CACHE_VERSION_KEY = 'products_cache_version';
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async bumpProductCacheVersion(): Promise<void> {
    const newVersion = Date.now(); // unique and always increasing

    await this.cacheManager.set(
      this.PRODUCT_CACHE_VERSION_KEY,
      newVersion,
      0, // no TTL
    );
  }

  private async getProductCacheVersion(): Promise<number> {
    const version = await this.cacheManager.get<number>(
      this.PRODUCT_CACHE_VERSION_KEY,
    );

    return version ?? 1;
  }

  // async getAllProducts(
  //   page = 1,
  //   limit = 20,
  // ): Promise<{
  //   data: ProductWithIdDto[];
  //   meta: { total: number; lastPage: number; page: number };
  // }> {
  //   const skip = (page - 1) * limit;
  //   const cacheKey = `products_page_${page}_limit_${limit}`;

  //   const cachedProducts = await this.cacheManager.get<{
  //     data: ProductWithIdDto[];
  //     meta: { total: number; lastPage: number; page: number };
  //   }>(cacheKey);

  //   if (cachedProducts) {
  //     return cachedProducts;
  //   }
  //   const products = await this.prisma.product.findMany({
  //     select: {
  //       id: true,
  //       title: true,
  //       price: true,
  //       imageUrl: true,
  //       description: true,
  //       quantity: true,
  //       cost: true,
  //     },
  //     skip: skip,
  //     take: limit,
  //   });

  //   if (!products) {
  //     throw new NotFoundException('Product not found');
  //   } else {
  //     //get total count of products
  //     const total = await this.prisma.product.count();
  //     // 💾 Step 3: Save to cache for 6000 seconds

  //     const response = {
  //       data: products,
  //       meta: {
  //         total,
  //         page,
  //         lastPage: Math.ceil(total / limit),
  //       },
  //     };
  //     await this.cacheManager.set(cacheKey, response, 6_000_000_000_000_000);
  //     return response;
  //   }
  // }

  // async getAllFeaturedProducts(
  //   page = 1,
  //   limit = 20,
  // ): Promise<{
  //   data: FeaturedProductWithIdDto[];
  //   meta: { total: number; lastPage: number; page: number };
  // }> {
  //   const skip = (page - 1) * limit;
  //   const cacheKey = `products_page_${page}_limit_${limit}`;

  //   const cachedProducts = await this.cacheManager.get<{
  //     data: FeaturedProductWithIdDto[];
  //     meta: { total: number; lastPage: number; page: number };
  //   }>(cacheKey);

  //   if (cachedProducts) {
  //     return cachedProducts;
  //   }
  //   const products = await this.prisma.product.findMany({
  //     select: {
  //       id: true,
  //       title: true,
  //       price: true,
  //       imageUrl: true,
  //       description: true,
  //       quantity: true,
  //       featured: true,
  //       cost: true,
  //     },
  //     where: {
  //       featured: true,
  //     },
  //     skip: skip,
  //     take: limit,
  //   });

  //   if (!products) {
  //     throw new NotFoundException('No featured Product found');
  //   } else {
  //     //get total count of featured products
  //     const total = await this.prisma.product.count({
  //       where: {
  //         featured: true,
  //       },
  //     });
  //     // 💾 Step 3: Save to cache for 6000 seconds
  //     const response = {
  //       data: products,
  //       meta: {
  //         total,
  //         page,
  //         lastPage: Math.ceil(total / limit),
  //       },
  //     };
  //     await this.cacheManager.set(cacheKey, response, 6_000_000_000_000_000);
  //     return response;
  //   }
  // }

  async getProductById(id: number): Promise<ProductWithIdDto> {
    const cacheKey = `product:${id}`;

    const cachedProduct =
      await this.cacheManager.get<ProductWithIdDto>(cacheKey);

    if (cachedProduct) {
      return cachedProduct;
    }
    const product = await this.prisma.product.findUnique({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        title: true,
        price: true,
        imageUrl: true,
        description: true,
        quantity: true,
        cost: true,
      },
    });

    //if not found, return an error of 404
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    // 💾 3. Store in Redis for 60 seconds
    await this.cacheManager.set(cacheKey, product, 2_600_000);
    //otherwise, return the task
    return product;
  }

  async deleteProductById(productId: number): Promise<ResponseMessage> {
    //find the product
    await this.getProductById(productId);

    //delete the product
    const deletedProduct = await this.prisma.product.delete({
      where: {
        id: Number(productId),
      },
    });

    if (!deletedProduct) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    //clear product cache
    await this.cacheManager.del(`product:${productId}`);
    //clear all product cache
    await this.bumpProductCacheVersion();

    return { message: Message.success };
  }

  //query database
  async queryProducts(queryProductDto: QueryProductDto): Promise<{
    products: ProductWithIdDto[];
    meta: { totalPages: number; totalProducts: number; lastPage: number };
  }> {
    const {
      name,
      categoryId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      isFeatured,
    } = queryProductDto;
    try {
      // Calculate offset based on page and limit
      const offset = (page - 1) * limit;
      const version = await this.getProductCacheVersion();

      const cacheKey = `v${version}_products_page_${page}_limit_${limit}_name_${name}_category_${categoryId}_minPrice_${minPrice}_maxPrice_${maxPrice}_isFeatured_${isFeatured}`;

      const cachedProducts = await this.cacheManager.get<{
        products: ProductWithIdDto[];
        meta: { totalPages: number; totalProducts: number; lastPage: number };
      }>(cacheKey);

      if (cachedProducts) {
        return cachedProducts;
      }
      const products = await this.prisma.product.findMany({
        where: {
          title: {
            contains:
              name !== undefined ? name.trim().toLowerCase() : undefined,
          },
          categoryId: categoryId ? Number(categoryId) : undefined,
          price: {
            gte: minPrice !== undefined ? Number(minPrice) : undefined,
            lte: maxPrice !== undefined ? Number(maxPrice) : undefined,
          },
          featured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        },
        select: {
          id: true,
          title: true,
          price: true,
          imageUrl: true,
          description: true,
          quantity: true,
          featured: true,
          cost: true,
        },
        take: Number(limit), // Number of results per page
        skip: Number(offset), // Skip the appropriate number of results
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Query total number of products matching the criteria without pagination
      const totalProducts = await this.prisma.product.count({
        where: {
          title: {
            contains:
              name !== undefined ? name.trim().toLowerCase() : undefined,
          },
          categoryId: categoryId ? Number(categoryId) : undefined,
          price: {
            gte: minPrice !== undefined ? Number(minPrice) : undefined,
            lte: maxPrice !== undefined ? Number(maxPrice) : undefined,
          },
          featured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
        },
      });

      // Calculate total number of pages
      const totalPages = Math.ceil(totalProducts / Number(limit));

      //send products
      const response = {
        products,
        meta: {
          totalPages,
          totalProducts,
          lastPage: Math.ceil(totalProducts / limit),
        },
      };
      await this.cacheManager.set(cacheKey, response, 2_600_000);

      return response;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async editProduct(
    productDto: ProductDto,
    id: string,
  ): Promise<ResponseMessage> {
    const { title, description, price, quantity, cost } = productDto;

    const convertedId = Number(id);

    try {
      await this.getProductById(convertedId);

      await this.prisma.product.update({
        data: {
          title: title.trim().toLowerCase(),
          description: description.trim().toLowerCase(),
          price: parseFloat(price.toFixed(2)),
          quantity: quantity,
          cost: parseFloat(cost.toFixed(2)),
        },
        where: {
          id: convertedId,
        },
      });

      //clear all product products cache
      await this.bumpProductCacheVersion();
      //clear product cache
      await this.cacheManager.del(`product:${convertedId}`);

      return { message: Message.success };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async createProduct(
    createProductDto: CreateProductDto,
  ): Promise<ResponseMessage> {
    const {
      categoryId,
      featured,
      title,
      price,
      imageUrl,
      description,
      quantity,
      cost,
    } = createProductDto;
    try {
      await this.prisma.product.create({
        data: {
          title: title.trim().toLowerCase(),
          description: description.trim().toLowerCase(),
          price: parseFloat(price.toFixed(2)),
          imageUrl,
          category: { connect: { id: Number(categoryId) } }, // use connect method
          quantity: Number(quantity),
          cost: parseFloat(cost.toFixed(2)),
          featured: Boolean(featured),
        },
      });
      //clear all product products cache
      await this.bumpProductCacheVersion();

      return { message: Message.success };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
