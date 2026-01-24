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
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const host = process.env.REDIS_HOST ?? '127.0.0.1';
        // const password = process.env.REDIS_PASSWORD ?? '';
        const port = Number(process.env.REDIS_PORT ?? 6379);

        try {
          const store = await redisStore({
            socket: { host, port },
            // password: password,
          });
          return {
            store: store as any,
            ttl: 60, // seconds
          } as any;
        } catch (err) {
          // Redis not available — fallback to in-memory cache so app keeps running
          // Log the error for debugging
          // eslint-disable-next-line no-console
          console.error(
            'Redis unavailable, falling back to in-memory cache',
            err,
          );
          return {
            ttl: 60, // default in-memory cache
          };
        }
      },
    }),
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
