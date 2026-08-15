import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { AboutModule } from './about/about.module';
import { HealthController } from './health/health.controller';

const throttleLimit = parseInt(process.env.THROTTLE_LIMIT || '20', 10);
const throttleTtl = parseInt(process.env.THROTTLE_TTL || '60000', 10);

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: throttleTtl,
        limit: throttleLimit,
      },
    ]),
    AuthModule,
    ProductModule,
    AboutModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
