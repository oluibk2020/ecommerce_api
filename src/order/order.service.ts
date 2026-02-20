import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from 'src/auth/dto/jwt-user.interface';
import { ProductService } from 'src/product/product.service';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from './dto/create-order.dto';
import { TransactionStatus } from '../helpers/general-enum';
import { EmailService } from 'src/email/email.service';
import { Message, ResponseMessage } from 'src/helpers/message.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { QueryOrderDto } from './dto/query-orders.dto';

@Injectable()
export class OrderService {
  private readonly ORDER_CACHE_VERSION_KEY = 'orders_cache_version';
  private adminEmail: string;
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private productService: ProductService,
    private configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.adminEmail = String(this.configService.get<string>('adminEmail'));
  }

  private async bumpOrderCacheVersion(): Promise<void> {
    const newVersion = Date.now(); // unique and always increasing

    await this.cacheManager.set(
      this.ORDER_CACHE_VERSION_KEY,
      newVersion,
      0, // no TTL
    );
  }

  private async getOrderCacheVersion(): Promise<number> {
    const version = await this.cacheManager.get<number>(
      this.ORDER_CACHE_VERSION_KEY,
    );

    return version ?? 1;
  }

  async getAllOrders(
    req: JwtUser,
    queryOrderDto: QueryOrderDto,
  ): Promise<{
    firstName: string;
    orders: any[];
    meta: { totalPages: number; totalOrders: number; lastPage: number };
  }> {
    try {
      const { isAdmin, isManager, firstName, sub } = req;
      const { page = 1, limit = 20 } = queryOrderDto;
      // Calculate offset based on page and limit
      const offset = (page - 1) * limit;
      const version = await this.getOrderCacheVersion();

      const cacheKey = `v${version}_orders_page_${page}_limit_${limit}`;

      const cachedOrders = await this.cacheManager.get<{
        firstName: string;
        orders: any[];
        meta: { totalPages: number; totalOrders: number; lastPage: number };
      }>(cacheKey);

      if (cachedOrders) {
        return cachedOrders;
      }
      if (isAdmin || isManager) {
        // If the user is an admin, fetch all orders
        const orders = await this.prisma.order.findMany({
          include: {
            orderItems: true,
            deliveryAddress: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                mobile: true,
              },
            },
          },
          take: Number(limit),
          skip: Number(offset),
          orderBy: {
            updatedAt: 'desc',
          },
        });

        const totalOrders = await this.prisma.order.count();
        const totalPages = Math.ceil(totalOrders / limit);
        const lastPage = totalPages === 0 ? 1 : totalPages;

        await this.cacheManager.set(
          cacheKey,
          { firstName, orders, meta: { totalPages, totalOrders, lastPage } },
          2_600_000,
        );

        return {
          firstName: firstName,
          orders,
          meta: { totalPages, totalOrders, lastPage },
        };
      }

      const orders = await this.prisma.order.findMany({
        where: {
          userId: sub,
        },
        include: {
          orderItems: true,
          deliveryAddress: true,
        },
        take: Number(limit),
        skip: Number(offset),
      });

      const totalOrders = await this.prisma.order.count({
        where: {
          userId: sub,
        },
      });
      const totalPages = Math.ceil(totalOrders / limit);
      const lastPage = totalPages === 0 ? 1 : totalPages;

      await this.cacheManager.set(
        cacheKey,
        { firstName, orders, meta: { totalPages, totalOrders, lastPage } },
        0, // no TTL
      );

      return {
        firstName: firstName,
        orders,
        meta: { totalPages, totalOrders, lastPage },
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getOrderById(
    id: number,
    req: JwtUser,
  ): Promise<{ order: object; products: any[] }> {
    const { isAdmin, isManager, sub } = req;
    const cacheKey = `order:${id}`;

    const cachedOrder = await this.cacheManager.get<{
      order: object;
      products: any[];
    }>(cacheKey);
    if (cachedOrder) {
      return cachedOrder;
    }

    if (isAdmin || isManager) {
      const order = await this.prisma.order.findUnique({
        where: {
          id: Number(id),
        },
        include: {
          orderItems: true,
          deliveryAddress: {
            select: {
              firstName: true,
              lastName: true,
              mobile: true,
              address: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              isManager: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID "${id}" not found`);
      }

      const orderedProducts: any[] = [];

      for (const item of order.orderItems) {
        const product = await this.productService.getProductById(
          item.productId,
        );
        // Fetch the product price
        // const product = await this.prisma.product.findUnique({
        //   where: { id: item.productId },
        // });

        orderedProducts.push(product);
      }

      await this.cacheManager.set(
        cacheKey,
        { order, products: orderedProducts },
        2_600_000,
      );

      return { order: order, products: orderedProducts };
    }

    const order = await this.prisma.order.findUnique({
      where: {
        id: Number(id),
        userId: Number(sub),
      },
      include: {
        orderItems: true,
        deliveryAddress: {
          select: {
            firstName: true,
            lastName: true,
            mobile: true,
            address: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    const orderedProducts: any[] = [];

    for (const item of order.orderItems) {
      // Fetch the product price
      const product = await this.productService.getProductById(item.productId);
      // const product = await this.prisma.product.findUnique({
      //   where: { id: item.productId },
      // });

      orderedProducts.push(product);
    }
    await this.cacheManager.set(
      cacheKey,
      { order, products: orderedProducts },
      2_600_000,
    );
    return { order: order, products: orderedProducts };
  }

  async deleteOrderById(id: number): Promise<ResponseMessage> {
    //find the order
    const order = await this.prisma.order.findFirst({
      where: {
        id: Number(id),
      },
    });

    //if order is not found
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    //delete all of the order items
    await this.prisma.orderItem.deleteMany({
      where: {
        orderId: Number(id),
      },
    });

    //delete the order
    await this.prisma.order.delete({
      where: {
        id: Number(id),
      },
    });

    //clear order cache
    await this.cacheManager.del(`order:${id}`);
    await this.bumpOrderCacheVersion();

    return { message: Message.success };
  }

  async updateOrder(
    orderDto: UpdateOrderDto,
    id: string,
    req: JwtUser,
  ): Promise<ResponseMessage> {
    const { otp, transactionStatus, discountAmount, discountPaymentStatus } =
      orderDto;

    if (transactionStatus === TransactionStatus.pending)
      throw new BadRequestException(
        `Order with ID "${id}" cannot be changed to pending transaction status. Choose either failed or success`,
      );

    //find the order
    const order = await this.prisma.order.findFirst({
      where: {
        id: Number(id),
      },
      select: {
        transactionStatus: true,
        orderItems: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    //if order is not found
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    if (order.transactionStatus === 'failed') {
      throw new BadRequestException(
        `Order with ID "${id}" has already been failed`,
      );
    }

    //find user
    const adminUser = await this.prisma.user.findFirst({
      where: {
        email: this.adminEmail,
      },
    });

    if (!adminUser) {
      throw new NotFoundException('Admin user not found. Please try again.');
    }

    // Check if a token already exists for the admin
    const adminToken = await this.prisma.userToken.findFirst({
      where: {
        userId: adminUser.id,
      },
    });

    // reject if no token is found or is expired or does not match otp
    if (!adminToken || adminToken.token !== otp) {
      throw new BadRequestException('Invalid or Expired OTP');
    }

    const expiresAt = new Date(adminToken.expiresAt).getTime();

    //delete token if expired
    if (Date.now() > expiresAt) {
      await this.prisma.userToken.delete({
        where: {
          id: adminToken.id,
        },
      });

      throw new BadRequestException('Invalid or Expired OTP');
    }

    //if transactionStatus is failed, then restock the product
    if (transactionStatus === TransactionStatus.failed) {
      for (const item of order.orderItems) {
        await this.prisma.product.update({
          where: {
            id: item.productId,
          },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    //update the order
    await this.prisma.order.update({
      where: {
        id: Number(id),
      },
      data: {
        transactionStatus: transactionStatus,
        discountAmount: Number(discountAmount),
        discountPaymentStatus: discountPaymentStatus,
      },
    });

    //delete the token
    await this.prisma.userToken.delete({
      where: {
        id: adminToken.id,
      },
    });

    //clear order cache
    await this.cacheManager.del(`order:${id}`);
    await this.bumpOrderCacheVersion();

    //send a successful email to the user
    await this.emailService.mailHandler(
      'Order Status Updated Successfully',
      `Your order with ID ${id} has been ${transactionStatus} successfully. You can check the status of your order by logging into your account. Thank you for shopping with us!`,
      req.email,
      'Order Status Updated Successfully',
    );

    //send a successful email to the admin
    await this.emailService.mailHandler(
      'Order Status Updated Successfully',
      `The order with ID ${id} has been ${transactionStatus} successfully. You can check the status of the order by logging into your account. Thank you for shopping with us!`,
      this.adminEmail,
      'Order Status Updated Successfully',
    );

    return { message: Message.success };
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
    req: JwtUser,
  ): Promise<ResponseMessage> {
    const { deliveryAddressId, cartItems, paymentMethod } = createOrderDto;
    const userId = Number(req.sub);

    for (const cartItem of cartItems) {
      const product = await this.productService.getProductById(cartItem.id);

      if (product.quantity < Number(cartItem.quantity)) {
        throw new BadRequestException(
          `${cartItem.quantity} pieces of Product - ${product.title} is out of stock. Please try again`,
        );
      }
    }

    // calculate total
    let totalAmount: number = cartItems.reduce((total, cartItem) => {
      return total + Number(cartItem.price) * Number(cartItem.quantity);
    }, 0);

    const VAT = (7.5 / 100) * totalAmount;
    if (totalAmount !== 0) totalAmount += VAT;

    //create the order data
    const orderData = {
      totalAmount: Number(totalAmount.toFixed(2)),
      user: {
        connect: { id: userId },
      },
      deliveryAddress: {
        connect: { id: deliveryAddressId },
      },
      transactionStatus: TransactionStatus.pending,
      paymentMethod,
      orderItems: {
        create: await Promise.all(
          cartItems.map(async (cartItem) => {
            const productRecord = await this.prisma.product.findUnique({
              where: { id: Number(cartItem.id) },
              select: { cost: true },
            });

            return {
              productId: Number(cartItem.id),
              quantity: Number(cartItem.quantity),
              price: Number(cartItem.price),
              costPrice: productRecord?.cost ?? 0,
            };
          }),
        ),
      },
    };

    const newOrder = await this.prisma.order.create({
      data: orderData,
      include: {
        orderItems: true,
      },
    });

    if (!newOrder) {
      throw new InternalServerErrorException();
    }

    // decrement product quantities
    for (const cartItem of cartItems) {
      await this.prisma.product.update({
        where: { id: Number(cartItem.id) },
        data: { quantity: { decrement: Number(cartItem.quantity) } },
      });
    }

    //clear order cache
    await this.bumpOrderCacheVersion();

    //send a successful email to the user
    await this.emailService.mailHandler(
      'Order Placed Successfully',
      `Your order has been placed successfully. The order ${newOrder.id} total amount is ${newOrder.totalAmount}. You can check the status of your order by logging into your account. Thank you for shopping with us!`,
      req.email,
      'Order Placed Successfully',
    );

    return { message: Message.success };
  }
}
