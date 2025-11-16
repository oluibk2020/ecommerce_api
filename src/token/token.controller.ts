import {
  Body,
  Controller,
  Logger,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from './token.service';
import { AdminOnly } from 'src/auth/guards/admin-decorator';
import { JwtUser } from '../auth/dto/jwt-user.interface';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { EmailDto, ResetPasswordDto } from './dto/reset-password.dto';
import { TokenType } from './token.type.enum';
import { ResponseMessage } from 'src/helpers/message.interface';

@Controller('token')
export class TokenController {
  private logger = new Logger('TokenController');
  private adminEmail: string;
  private tokenType: TokenType;
  constructor(
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {
    this.adminEmail = String(this.configService.get<string>('adminEmail'));
  }

  @AdminOnly()
  @Post('/admin/create')
  async createToken(
    @Req() req: Request & { user: JwtUser },
  ): Promise<ResponseMessage> {
    if (req.user.email !== this.adminEmail) {
      throw new UnauthorizedException(
        'Only administrators can access this resource',
      );
    }

    this.tokenType = TokenType.ORDER_TRANSACTION;

    return this.tokenService.generateToken(req.user.email, this.tokenType);
  }

  @Post('/reset-password/generate')
  async generateTokenToResetPassword(
    @Body() emailDto: EmailDto,
  ): Promise<ResponseMessage> {
    const { email } = emailDto;
    this.tokenType = TokenType.RESET;
    return this.tokenService.generateToken(email, this.tokenType);
  }

  @Patch('/reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResponseMessage> {
    return this.tokenService.validateToken(resetPasswordDto);
  }
}
