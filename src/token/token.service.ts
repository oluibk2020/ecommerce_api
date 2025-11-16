import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { EmailService } from '../email/email.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import bcrypt from 'bcrypt';
import { TokenType } from './token.type.enum';
import { Message, ResponseMessage } from 'src/helpers/message.interface';

@Injectable()
export class TokenService {
  constructor(
    private prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async generateToken(
    email: string,
    tokenType: TokenType,
  ): Promise<ResponseMessage> {
    // Create random number without leading zeros
    const sixDigit: number = Math.floor(100000 + Math.random() * 900000);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes from now

    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    // Check if a token already exists for the user
    const existingToken = await this.prisma.userToken.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (existingToken) {
      // Delete the existing token
      await this.prisma.userToken.delete({
        where: {
          id: existingToken.id,
        },
      });
    }

    //generate a unique reset token and save in database
    const generateToken = sixDigit.toString();

    await this.prisma.userToken.create({
      data: {
        token: generateToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    //send email with the token
    await this.emailService.mailHandler(
      `Hello ${user.firstName + ' ' + user.lastName}`,
      `Kindly find your token for ${tokenType} on your account.
       <br><br>
      
      Token/OTP: ${generateToken}
      <br><br>
      
      If you didn't make this request, please contact Tech support immediately`,
      `${email}`,
      'Token Request Confirmation',
    );

    return { message: Message.success };
  }

  async validateToken(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResponseMessage> {
    const { token, newPassword, email } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    const resetToken = await this.prisma.userToken.findFirst({
      where: {
        token: String(token),
        userId: user.id,
      },
    });

    if (!resetToken) {
      throw new BadRequestException(
        `Invalid or Expired Token, Kindly request for a new one`,
      );
    }

    const expiresAt = new Date(resetToken.expiresAt).getTime();

    if (Date.now() > expiresAt) {
      //delete the used reset token
      await this.prisma.userToken.delete({
        where: {
          id: resetToken.id,
        },
      });
      throw new BadRequestException(
        `Invalid or Expired Token, Kindly request for a new one`,
      );
    }

    //hash the password
    const saltRounds: number = 10;
    const salt: string = await bcrypt.genSalt(saltRounds);
    const hashedPassword: string = await bcrypt.hash(newPassword, salt);

    await this.prisma.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    //delete the all tokens of user

    await this.prisma.userToken.deleteMany({
      where: {
        userId: resetToken.userId,
      },
    });

    //send email for success
    await this.emailService.mailHandler(
      `Hello ${user.firstName + ' ' + user.lastName}`,
      `You have successfully reset your Account password
      
      If you didn't make this request, please contact Admin immediately`,
      `${user.email}`,
      'Reset Password Successful',
    );

    return { message: Message.success };
  }
}
