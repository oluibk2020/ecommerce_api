import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import {
  DiscountPaymentStatus,
  TransactionStatus,
} from '../../helpers/general-enum';

export class UpdateOrderDto {
  @IsNotEmpty()
  @IsString()
  otp: string;

  @IsNotEmpty()
  @IsEnum(['failed', 'success', 'pending'])
  transactionStatus: TransactionStatus;

  @IsNotEmpty()
  @IsNumber()
  discountAmount: number;

  @IsEnum(['failed', 'success', 'pending'])
  discountPaymentStatus: DiscountPaymentStatus;
}
