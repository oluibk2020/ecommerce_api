import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { PaymentMethod } from '../../helpers/general-enum';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  deliveryAddressId: number;

  @IsNotEmpty()
  cartItems: any[];

  @IsNotEmpty()
  @IsEnum(['flutterwave', 'paystack', 'cash'])
  paymentMethod: PaymentMethod;
}
