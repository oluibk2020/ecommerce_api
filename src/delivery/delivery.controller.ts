import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtUser } from 'src/auth/dto/jwt-user.interface';
import { CreateDeliveryDto, Delivery } from './dto/delivery.dto';

@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('/add')
  async createDelivery(
    @Req() req: Request & { user: JwtUser },
    @Body() createDeliveryDto: CreateDeliveryDto,
  ): Promise<Delivery> {
    return this.deliveryService.createDelivery(createDeliveryDto, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  async getDeliveryById(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtUser },
  ): Promise<Delivery> {
    return this.deliveryService.getDeliveryById(Number(id), req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllDelivery(
    @Req() req: Request & { user: JwtUser },
  ): Promise<Delivery[]> {
    return this.deliveryService.getAllDelivery(req.user);
  }
}
