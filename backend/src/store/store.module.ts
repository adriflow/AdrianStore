import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
