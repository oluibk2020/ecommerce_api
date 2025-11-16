import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../auth/dto/jwt-user.interface';
import { CreateDeliveryDto, Delivery } from './dto/delivery.dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async createDelivery(
    createDeliveryDto: CreateDeliveryDto,
    req: JwtUser,
  ): Promise<Delivery> {
    const { mobile, firstName, lastName, address } = createDeliveryDto;

    const userId = req.sub;
    try {
      const delivery = await this.prisma.deliveryAddress.create({
        data: {
          mobile,
          firstName,
          lastName,
          address,
          userId,
        },
      });

      return delivery;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async getAllDelivery(req: JwtUser): Promise<Delivery[]> {
    const userId = req.sub;

    const delivery = await this.prisma.deliveryAddress.findMany({
      where: {
        userId,
      },
    });

    if (!delivery) {
      throw new NotFoundException(
        `No Delivery address found. Try to create one.`,
      );
    }

    return delivery;
  }

  async getDeliveryById(id: number, req: JwtUser): Promise<Delivery> {
    const userId = req.sub;

    const delivery = await this.prisma.deliveryAddress.findUnique({
      where: {
        id,
        userId,
      },
    });

    //if not found, return an error of 404
    if (!delivery) {
      throw new NotFoundException(`Delivery with ID "${id}" not found`);
    }

    return delivery;
  }
}
