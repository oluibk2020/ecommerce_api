import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import bcrypt from 'bcrypt';
import { PostgresError } from '../errors/errors.interface';
import { RegisterCredentialsDto } from 'src/user/dto/register-credentials.dto';
import { EmailService } from '../email/email.service';
import { Message, ResponseMessage } from '../helpers/message.interface';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async getUsers() {
    return await this.prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
      },
    });
  }

  async getUserByEmail(email: string): Promise<{
    email: string;
    firstName: string;
    lastName: string;
    mobile: string;
  }> {
    const found = await this.prisma.user.findFirst({
      where: { email },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
      },
    });

    if (!found) {
      throw new NotFoundException('User not found');
    } else {
      return found;
    }
  }

  //update user manager role
  async updateUser(
    email: string,
    managerRoleStatus: boolean,
  ): Promise<ResponseMessage> {
    // console.log(email);
    await this.getUserByEmail(email);

    await this.prisma.user.update({
      where: { email },
      data: { isManager: managerRoleStatus },
    });

    return { message: Message.success };
  }

  //create user
  async createUser(
    registerCredentialsDto: RegisterCredentialsDto,
  ): Promise<ResponseMessage> {
    const { email, password, mobile, firstName, lastName } =
      registerCredentialsDto;

    //hash the password
    const saltRounds: number = 10;
    const salt: string = await bcrypt.genSalt(saltRounds);
    const hashedPassword: string = await bcrypt.hash(password, salt);

    //create a user
    try {
      await this.prisma.user.create({
        data: {
          password: hashedPassword,
          email,
          mobile,
          firstName,
          lastName,
        },
      });

      return { message: Message.success };
    } catch (error) {
      if ((error as PostgresError).code === 'P2002') {
        throw new ConflictException('Email already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
