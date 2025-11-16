import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { JwtUser } from '../auth/dto/jwt-user.interface';
import { AdminOnly } from 'src/auth/guards/admin-decorator';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ResponseMessage } from 'src/helpers/message.interface';

@Controller('order')
export class OrderController {
  private logger = new Logger('OrderController');
  constructor(private orderService: OrderService) {}

  //protect this route
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllOrders(
    @Req() req: Request & { user: JwtUser },
  ): Promise<{ firstName: string; orders: any[] }> {
    const { isAdmin, isManager, firstName, sub, email, lastName, mobile } =
      req.user; // now typed as JwtUser, safe to destructure

    return this.orderService.getAllOrders({
      isAdmin,
      isManager,
      firstName,
      sub,
      lastName,
      mobile,
      email,
    });
  }

  //protect this route
  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  async getOrderById(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<{ order: object; products: any[] }> {
    return this.orderService.getOrderById(Number(id), req.user);
  }

  @AdminOnly()
  @Delete('/delete/:id')
  async deleteOrderById(@Param('id') id: string): Promise<ResponseMessage> {
    return this.orderService.deleteOrderById(Number(id));
  }

  @AdminOnly()
  @Patch('/update/:id')
  async updateOrder(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
    @Body() orderDto: UpdateOrderDto,
  ): Promise<ResponseMessage> {
    return this.orderService.updateOrder(orderDto, id, req.user);
  }

  //create order
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createOrder(
    @Req() req: Request & { user: JwtUser },
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<ResponseMessage> {
    return this.orderService.createOrder(createOrderDto, req.user);
  }
}
