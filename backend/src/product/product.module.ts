import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StoreModule } from '../store/store.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';


@Module({
  imports: [AuthModule, forwardRef(() => StoreModule)],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
