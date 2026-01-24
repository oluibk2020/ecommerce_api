import {
  ConflictException,
  Inject,
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
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUsers() {
    const cacheKey = 'all_users';

    // 🔍 Step 1: Check cache first
    const cachedUsers = await this.cacheManager.get(cacheKey);

    if (cachedUsers) {
      console.log('⚡ Returning users from Redis cache');
      return cachedUsers;
    }

    const users = await this.prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
      },
    });

    // 💾 Step 3: Save to cache for 60 seconds
    await this.cacheManager.set(cacheKey, users, 60_000);

    return users;
  }

  async getUserByEmail(email: string): Promise<{
    email: string;
    firstName: string;
    lastName: string;
    mobile: string;
    id: number;
    isManager: boolean;
    isAdmin: boolean;
  }> {
    const cacheKey = `user:${email}`;

    // 🔍 1. Check Redis cache first
    const cachedUser:
      | {
          email: string;
          firstName: string;
          lastName: string;
          mobile: string;
          id: number;
          isManager: boolean;
          isAdmin: boolean;
        }
      | undefined = await this.cacheManager.get(cacheKey);
    if (cachedUser) {
      console.log('⚡ User returned from Redis cache');
      return cachedUser;
    }
    const found = await this.prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        isManager: true,
        isAdmin: true,
      },
    });

    if (!found) {
      throw new NotFoundException('User not found');
    } else {
      // 💾 3. Store in Redis for 60 * 60 seconds
      await this.cacheManager.set(cacheKey, found, 60 * 60_000);

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

    //clear user cache
    await this.cacheManager.del(`user:${email}`);

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

      //clear user cache
      await this.cacheManager.del('all_users');

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
