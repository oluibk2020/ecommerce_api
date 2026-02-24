import { IsBoolean, IsNumber, IsNotEmpty } from 'class-validator';

export class ProductDiscountDto {
  @IsBoolean()
  @IsNotEmpty()
  //send out error message if the value is not a boolean or is missing
  isActivated: boolean = false;

  @IsNotEmpty()
  @IsNumber()
  percentageAmount: number = 5;
}
