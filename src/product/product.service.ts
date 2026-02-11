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
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAllProducts(): Promise<ProductWithIdDto[]> {
    const cacheKey = 'all_products';

    const cachedProducts =
      await this.cacheManager.get<ProductWithIdDto[]>(cacheKey);

    if (cachedProducts) {
      return cachedProducts;
    }
    const products = await this.prisma.product.findMany({
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

    if (!products) {
      throw new NotFoundException('Product not found');
    } else {
      // 💾 Step 3: Save to cache for 6000 seconds
      await this.cacheManager.set(cacheKey, products, 6_000_000);
      return products;
    }
  }
  async getAllFeaturedProducts(): Promise<FeaturedProductWithIdDto[]> {
    const cacheKey = 'all_featured_products';

    const cachedProducts =
      await this.cacheManager.get<FeaturedProductWithIdDto[]>(cacheKey);

    if (cachedProducts) {
      return cachedProducts;
    }
    const products = await this.prisma.product.findMany({
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
      where: {
        featured: true,
      },
    });

    if (!products) {
      throw new NotFoundException('No featured Product found');
    } else {
      // 💾 Step 3: Save to cache for 6000 seconds
      await this.cacheManager.set(cacheKey, products, 6_000_000);
      return products;
    }
  }

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
    await this.cacheManager.set(cacheKey, product, 6_000_000);
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
    //clear all product and featured products cache
    await this.cacheManager.del('all_products');
    await this.cacheManager.del('all_featured_products');

    return { message: Message.success };
  }

  //query database
  async queryProducts(
    queryProductDto: QueryProductDto,
  ): Promise<{ products: ProductWithIdDto[]; totalPages: number }> {
    const { name, categoryId, minPrice, maxPrice, page, limit } =
      queryProductDto;
    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;

    console.log(offset);
    try {
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
      });

      // Query total number of products without pagination
      const totalProducts = await this.prisma.product.count({
        where: {
          title: {
            contains: name,
          },
          categoryId: categoryId ? Number(categoryId) : undefined,
          price: {
            gte: minPrice !== undefined ? Number(minPrice) : undefined,
            lte: maxPrice !== undefined ? Number(maxPrice) : undefined,
          },
        },
      });

      // Calculate total number of pages
      const totalPages = Math.ceil(totalProducts / Number(limit));

      //send products
      return { products, totalPages };
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

      //clear all product and featured products cache
      await this.cacheManager.del('all_products');
      await this.cacheManager.del('all_featured_products');
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

      //clear all product and featured products cache
      await this.cacheManager.del('all_products');
      await this.cacheManager.del('all_featured_products');

      return { message: Message.success };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
