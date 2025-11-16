import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { EmailService } from 'src/email/email.service';

@Module({
  providers: [TokenService, EmailService],
  controllers: [TokenController],
})
export class TokenModule {}
