import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { AboutModule } from './about/about.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    AuthModule,
    ProductModule,
    AboutModule,
  ],
})
export class AppModule {}
