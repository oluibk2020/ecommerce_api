import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { configValidationSchema } from './config/joi.config.schema';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { TokenModule } from './token/token.module';
import { DeliveryModule } from './delivery/delivery.module';
import { CategoryModule } from './category/category.module';
import { CronModule } from './cron/cron.module';
import emailConfig from './config/email.config';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, emailConfig],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`],
      validationSchema: configValidationSchema,
    }),
    UserModule,
    ProductModule,
    OrderModule,
    TokenModule,
    DeliveryModule,
    CategoryModule,
    CronModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
