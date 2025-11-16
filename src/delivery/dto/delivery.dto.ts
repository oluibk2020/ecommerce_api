import { IsNotEmpty, IsString } from 'class-validator';
export class CreateDeliveryDto {
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  address: string;
}

export class Delivery extends CreateDeliveryDto {
  id: number;
  createdAt: Date;
  updatedAt: Date | null;
  userId: number;
}
