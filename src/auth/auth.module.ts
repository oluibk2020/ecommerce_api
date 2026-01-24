import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './dto/jwt.strategy';
import { UserModule } from 'src/user/user.module';
import { TwoFactorService } from './services/two-factor.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TwoFactorService],
  imports: [
    ConfigModule,
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: Number(3200),
        },
      }),
    }),
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
