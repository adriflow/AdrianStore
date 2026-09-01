import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StoreModule } from '../store/store.module';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';

@Module({
  imports: [AuthModule, forwardRef(() => StoreModule)],
  controllers: [AboutController],
  providers: [AboutService],
  exports: [AboutService],
})
export class AboutModule {}
