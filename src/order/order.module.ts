import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { ProductService } from '../product/product.service';
import { EmailService } from '../email/email.service';

@Module({
  providers: [OrderService, ProductService, EmailService],
  controllers: [OrderController],
})
export class OrderModule {}
